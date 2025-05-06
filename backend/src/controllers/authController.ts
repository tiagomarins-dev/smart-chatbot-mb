import { Request, Response } from 'express';
import { User } from '../interfaces';
import { getSupabaseAdmin } from '../services/supabaseService';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';
import { generateToken } from '../middleware/auth';

/**
 * User login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email e senha são obrigatórios', HttpStatus.BAD_REQUEST);
      return;
    }

    console.log(`Tentando fazer login com email: ${email}`);
    
    const supabase = getSupabaseAdmin();
    
    // Sign in with Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erro de login Supabase:', error.message);
      sendError(res, error.message, HttpStatus.UNAUTHORIZED);
      return;
    }

    console.log('Login Supabase bem-sucedido, buscando dados do usuário');
    
    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError.message);
    }

    // Se não encontrarmos o perfil do usuário, criaremos um básico
    let user: User;
    
    if (!userData) {
      console.log('Perfil de usuário não encontrado, criando um novo perfil');
      
      // Create a basic user profile
      const { data: newUserData, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name: email.split('@')[0]
          }
        ])
        .select();

      if (insertError) {
        console.error('Erro ao criar perfil de usuário:', insertError.message);
        sendError(res, 'Erro ao criar perfil de usuário', HttpStatus.INTERNAL_SERVER_ERROR);
        return;
      }
      
      user = {
        id: data.user.id,
        email: data.user.email || '',
        role: 'user',
        name: email.split('@')[0]
      };
    } else {
      console.log('Perfil de usuário encontrado');
      
      user = {
        id: userData.id,
        email: data.user.email || '',
        role: 'user',
        name: userData.name
      };
    }

    console.log(`Gerando token JWT para usuário ${user.id}`);
    
    // Generate JWT token
    const token = generateToken(user);

    sendSuccess(res, {
      user,
      token,
      session: data.session
    });
  } catch (error) {
    console.error('Erro de login:', error);
    sendError(res, 'Falha na autenticação', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * User registration
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      sendError(res, 'Email, senha e nome são obrigatórios', HttpStatus.BAD_REQUEST);
      return;
    }

    console.log(`Tentando registrar usuário com email: ${email}`);
    
    const supabase = getSupabaseAdmin();
    
    // Registrar usuário diretamente com o cliente Supabase adminAuth
    // Não valida o email automaticamente, o que pode causar o problema
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirma o email automaticamente
    });

    if (error) {
      console.error('Erro no registro Supabase:', error.message);
      sendError(res, error.message, HttpStatus.BAD_REQUEST);
      return;
    }

    if (!data.user?.id) {
      console.error('Registro Supabase falhou, ID de usuário não recebido');
      sendError(res, 'Falha ao criar usuário', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    console.log(`Usuário criado no Supabase Auth com ID ${data.user.id}, criando perfil de usuário`);

    // Create user profile in database
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          name: name
        }
      ])
      .select();

    if (userError) {
      console.error('Erro ao criar perfil de usuário:', userError.message);
      sendError(res, userError.message, HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    console.log('Registro completo com sucesso');
    
    // Construa o objeto de usuário com os dados que temos
    const user = {
      id: data.user.id,
      email: data.user.email || '',
      name: name,
      role: 'user'
    };
    
    sendSuccess(res, {
      message: 'Usuário registrado com sucesso',
      user: user
    }, HttpStatus.CREATED);
  } catch (error) {
    console.error('Erro de registro:', error);
    sendError(res, 'Falha no registro', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Verify token validity
 */
export async function verifyToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      sendError(res, 'Token é obrigatório', HttpStatus.BAD_REQUEST);
      return;
    }

    console.log('Verificando token JWT');
    
    // This function is defined in the auth middleware
    const authResult = await import('../middleware/auth')
      .then(module => module.verifyToken(token));

    if (!authResult.authenticated) {
      console.error('Token inválido ou expirado:', authResult.error);
      sendError(res, authResult.error || 'Token inválido', HttpStatus.UNAUTHORIZED);
      return;
    }

    console.log(`Token válido para usuário ${authResult.user_id}, buscando detalhes do usuário`);
    
    // Get user details
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', authResult.user_id)
      .single();

    if (error) {
      console.error('Erro ao buscar detalhes do usuário:', error.message);
      sendError(res, 'Erro ao buscar detalhes do usuário', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    if (!data) {
      console.error('Usuário não encontrado no banco de dados');
      sendError(res, 'Usuário não encontrado', HttpStatus.NOT_FOUND);
      return;
    }

    // Obter o email do usuário a partir do Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      authResult.user_id
    );
    
    if (userError) {
      console.error('Erro ao buscar dados do usuário no Auth:', userError.message);
      sendError(res, 'Erro ao buscar dados do usuário', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    const user = {
      id: data.id,
      name: data.name,
      email: userData.user?.email || '',
      role: 'user'
    };

    console.log('Verificação de token concluída com sucesso');
    
    sendSuccess(res, {
      valid: true,
      user: user
    });
  } catch (error) {
    console.error('Erro de verificação de token:', error);
    sendError(res, 'Falha na verificação do token', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
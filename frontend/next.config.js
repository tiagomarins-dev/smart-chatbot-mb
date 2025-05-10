/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Proxy todas as requisições /api/* para o backend correto, dependendo do ambiente
  async rewrites() {
    // Quando estamos dentro do Docker, precisamos usar o nome do serviço como hostname
    const inDocker = process.env.NEXT_PUBLIC_IN_DOCKER === 'true';

    // Definição explícita do host baseado no ambiente
    const host = inDocker ? 'backend:9033' : 'localhost:9033';

    console.log(`API proxy configurado para: ${host}`);

    return [
      {
        source: '/api/:path*',
        destination: `http://${host}/api/:path*`,
      },
    ];
  },
};

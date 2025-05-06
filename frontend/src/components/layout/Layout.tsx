import React, { useEffect } from 'react';
import Head from 'next/head';
import Navigation from './Navigation';
import RealtimeNotifications from '../common/RealtimeNotifications';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Smart CRM',
  description = 'Sistema CRM para gerenciar empresas, projetos e leads',
}) => {
  const { isAuthenticated } = useAuth();
  
  // This forces all table elements to use the correct dark mode styles
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const applyDarkModeToElement = (element: HTMLElement) => {
        // Apply directly with class + data attributes
        element.classList.add('dark-mode-table');
        element.setAttribute('data-bs-theme', 'dark');
        element.setAttribute('data-theme-mode', 'dark');
        
        // Apply with inline styles for maximum override capability
        element.style.setProperty('background-color', 'var(--dark-card)', 'important');
        element.style.setProperty('color', 'var(--dark-text)', 'important');
        element.style.setProperty('border-color', 'var(--dark-table-border)', 'important');
        
        // Set specific styles based on element type
        if (element.tagName === 'TR') {
          // For table rows, ensure the background color is explicitly set
          element.style.setProperty('background-color', 'var(--dark-card)', 'important');
        } else if (element.tagName === 'TABLE') {
          // For table elements, ensure all borders are properly set
          element.style.setProperty('border-color', 'var(--dark-table-border)', 'important');
        } else if (element.tagName === 'THEAD' || element.tagName === 'TH') {
          // For table headers, use the header background color
          element.style.setProperty('background-color', 'var(--dark-table-header)', 'important');
        }
      };
      
      const removeDarkModeFromElement = (element: HTMLElement) => {
        element.classList.remove('dark-mode-table');
        element.removeAttribute('data-bs-theme');
        element.removeAttribute('data-theme-mode');
        element.style.removeProperty('background-color');
        element.style.removeProperty('color');
        element.style.removeProperty('border-color');
      };
      
      const applyDarkModeToAllTableElements = () => {
        // Use a wide selector to catch all possible table elements
        const tableElements = document.querySelectorAll(
          'table, .table, tr, td, th, thead, tbody, tfoot, .table-responsive, ' +
          '.table-striped, .table-hover, .table-bordered, ' +
          '.table tr, .table td, .table th, ' + 
          'table tr, table td, table th'
        );
        
        tableElements.forEach(el => applyDarkModeToElement(el as HTMLElement));
      };
      
      const removeDarkModeFromAllTableElements = () => {
        const darkModeElements = document.querySelectorAll('.dark-mode-table');
        darkModeElements.forEach(el => removeDarkModeFromElement(el as HTMLElement));
      };
      
      // Force dark mode styles on table elements when theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const body = document.body;
            const isDarkMode = body.classList.contains('dark-mode');
            
            if (isDarkMode) {
              applyDarkModeToAllTableElements();
              
              // Also set a data attribute on body to allow CSS selectors to target it
              document.body.setAttribute('data-theme', 'dark');
            } else {
              removeDarkModeFromAllTableElements();
              
              // Remove the data attribute
              document.body.removeAttribute('data-theme');
            }
          }
        });
      });
      
      // Start watching for class changes on body
      observer.observe(document.body, { attributes: true });
      
      // Run once initially to handle current state
      const isDarkMode = document.body.classList.contains('dark-mode');
      if (isDarkMode) {
        applyDarkModeToAllTableElements();
        document.body.setAttribute('data-theme', 'dark');
      }
      
      // Handle dynamically added table elements with a more comprehensive approach
      const bodyObserver = new MutationObserver((mutations) => {
        if (document.body.classList.contains('dark-mode')) {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                  const element = node as HTMLElement;
                  
                  // Check if this element is a table-related element
                  if (['TABLE', 'TR', 'TD', 'TH', 'THEAD', 'TBODY', 'TFOOT'].includes(element.tagName) || 
                      element.classList.contains('table') || 
                      element.classList.contains('table-responsive')) {
                    
                    applyDarkModeToElement(element);
                  }
                  
                  // Also check all descendants of this element
                  const tableDescendants = element.querySelectorAll(
                    'table, .table, tr, td, th, thead, tbody, tfoot, .table-responsive, ' +
                    '.table-striped, .table-hover, .table-bordered, ' +
                    '.table tr, .table td, .table th, ' + 
                    'table tr, table td, table th'
                  );
                  
                  tableDescendants.forEach(el => applyDarkModeToElement(el as HTMLElement));
                }
              });
            }
          });
        }
      });
      
      // Watch for DOM changes to catch dynamically added table elements
      bodyObserver.observe(document.body, { childList: true, subtree: true });
      
      // Additional observer for when the body node is actually changed
      // This ensures that internal changes to tbody/table rows are caught
      const tableContentObserver = new MutationObserver((mutations) => {
        if (document.body.classList.contains('dark-mode')) {
          let needsReapplication = false;
          
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' && 
                (mutation.target.nodeName === 'TABLE' || 
                 mutation.target.nodeName === 'TBODY' ||
                 mutation.target.nodeName === 'THEAD' ||
                 mutation.target.nodeName === 'TR' ||
                 (mutation.target as Element).classList.contains('table-responsive'))) {
              needsReapplication = true;
            }
          });
          
          if (needsReapplication) {
            // Reapply dark mode to all table elements
            setTimeout(() => applyDarkModeToAllTableElements(), 0);
          }
        }
      });
      
      // Watch for changes specifically in table content
      const tables = document.querySelectorAll('table, .table, .table-responsive');
      tables.forEach(table => {
        tableContentObserver.observe(table, { childList: true, subtree: true });
      });
      
      // Clean up
      return () => {
        observer.disconnect();
        bodyObserver.disconnect();
        tableContentObserver.disconnect();
      };
    }
  }, []);
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Add Bootstrap Icons CSS */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
        
        {/* Add script to immediately apply dark mode to tables on load */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Run immediately to apply dark mode to tables if needed
          (function() {
            if (document.body.classList.contains('dark-mode') || document.body.getAttribute('data-theme') === 'dark') {
              // Select all table elements
              const tableElements = document.querySelectorAll(
                'table, .table, tr, td, th, thead, tbody, tfoot, .table-responsive, ' +
                '.table-striped, .table-hover, .table-bordered'
              );
              
              // Apply dark mode styles
              tableElements.forEach(el => {
                el.classList.add('dark-mode-table');
                el.setAttribute('data-bs-theme', 'dark');
                el.setAttribute('data-theme-mode', 'dark');
                
                // Apply inline styles for immediate effect
                if (el instanceof HTMLElement) {
                  el.style.setProperty('background-color', 'var(--dark-card)', 'important');
                  el.style.setProperty('color', 'var(--dark-text)', 'important');
                  el.style.setProperty('border-color', 'var(--dark-table-border)', 'important');
                }
              });
            }
          })();
        `}} />
        
        {/* Add extra CSS to override Bootstrap table styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Inline critical table styles with very high specificity for immediate application */
          html body.dark-mode table,
          html body.dark-mode .table,
          html body.dark-mode tr,
          html body.dark-mode td,
          html body.dark-mode th,
          html body.dark-mode tbody,
          html body.dark-mode thead,
          html body.dark-mode .table-responsive,
          [data-theme="dark"] table,
          [data-theme="dark"] .table,
          [data-theme="dark"] tr,
          [data-theme="dark"] td,
          [data-theme="dark"] th {
            background-color: var(--dark-card) !important;
            color: var(--dark-text) !important;
            border-color: var(--dark-table-border) !important;
          }
          
          /* Specific styles for table headers */
          html body.dark-mode thead,
          html body.dark-mode th,
          html body.dark-mode thead th,
          html body.dark-mode thead td,
          [data-theme="dark"] thead,
          [data-theme="dark"] thead th {
            background-color: var(--dark-table-header) !important;
            color: var(--dark-text) !important;
          }
          
          /* Specific styles for dark-mode-table class */
          .dark-mode-table,
          tr.dark-mode-table,
          td.dark-mode-table,
          th.dark-mode-table {
            background-color: var(--dark-card) !important;
            color: var(--dark-text) !important;
            border-color: var(--dark-table-border) !important;
          }
          
          /* Striped table rows in dark mode */
          html body.dark-mode .table-striped tbody tr:nth-of-type(odd),
          [data-theme="dark"] .table-striped tbody tr:nth-of-type(odd) {
            background-color: rgba(255, 255, 255, 0.05) !important;
            color: var(--dark-text) !important;
          }
          
          /* Handle hover effects */
          html body.dark-mode .table-hover tbody tr:hover,
          html body.dark-mode tr:hover,
          [data-theme="dark"] .table-hover tbody tr:hover {
            background-color: var(--dark-table-hover) !important;
            color: var(--dark-text) !important;
          }
          
          /* Force all Bootstrap table cells in dark mode */
          html body.dark-mode .table-responsive *,
          html body.dark-mode table *,
          [data-theme="dark"] .table-responsive *,
          [data-theme="dark"] table * {
            color: var(--dark-text) !important;
          }
        `}} />
      </Head>
      
      <div className="d-flex flex-column min-vh-100">
        <Navigation />
        
        <main className="flex-grow-1 py-4">
          <div className="container">
            {children}
          </div>
        </main>
        
        <footer className="py-3 bg-light">
          <div className="container text-center">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Smart CRM. Todos os direitos reservados.
            </p>
          </div>
        </footer>
        
        {/* Real-time notifications for authenticated users */}
        {isAuthenticated && <RealtimeNotifications />}
        
        {/* Theme toggle button */}
        <ThemeToggle />
      </div>
    </>
  );
};

export default Layout;
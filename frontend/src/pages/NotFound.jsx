import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-blue-700 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Página não encontrada</h2>
        <p className="text-slate-600 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            asChild
          >
            <Link to="/">
              <Home className="h-4 w-4" />
              Página Inicial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


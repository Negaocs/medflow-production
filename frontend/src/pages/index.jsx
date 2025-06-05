import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Medicos from "./Medicos";

import Plantoes from "./Plantoes";

import Empresas from "./Empresas";

import Hospitais from "./Hospitais";

import TiposPlantao from "./TiposPlantao";

import Contratos from "./Contratos";

import DescontosCreditos from "./DescontosCreditos";

import VinculosMedicos from "./VinculosMedicos";

import ProcedimentosParticulares from "./ProcedimentosParticulares";

import GruposAcesso from "./GruposAcesso";

import ProducaoAdministrativa from "./ProducaoAdministrativa";

import ProLabores from "./ProLabores";

import TabelasINSS from "./TabelasINSS";

import TabelasIRRF from "./TabelasIRRF";

import Usuarios from "./Usuarios";

import ImportacaoExportacao from "./ImportacaoExportacao";

import ParametrosFiscaisEmpresaPage from "./ParametrosFiscaisEmpresaPage";

import CalculoProducaoPage from "./CalculoProducaoPage";

import VinculosFiscaisMedicos from "./VinculosFiscaisMedicos";

import CalculoProLaborePage from "./CalculoProLaborePage";

import ProducaoAdministrativaPage from "./ProducaoAdministrativaPage";

import RelatoriosPage from "./RelatoriosPage";

import DocumentacaoTecnica from "./DocumentacaoTecnica";

import ParametrosPDF from "./ParametrosPDF";

import { Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Medicos: Medicos,
    
    Plantoes: Plantoes,
    
    Empresas: Empresas,
    
    Hospitais: Hospitais,
    
    TiposPlantao: TiposPlantao,
    
    Contratos: Contratos,
    
    DescontosCreditos: DescontosCreditos,
    
    VinculosMedicos: VinculosMedicos,
    
    ProcedimentosParticulares: ProcedimentosParticulares,
    
    GruposAcesso: GruposAcesso,
    
    ProducaoAdministrativa: ProducaoAdministrativa,
    
    ProLabores: ProLabores,
    
    TabelasINSS: TabelasINSS,
    
    TabelasIRRF: TabelasIRRF,
    
    Usuarios: Usuarios,
    
    ImportacaoExportacao: ImportacaoExportacao,
    
    ParametrosFiscaisEmpresaPage: ParametrosFiscaisEmpresaPage,
    
    CalculoProducaoPage: CalculoProducaoPage,
    
    VinculosFiscaisMedicos: VinculosFiscaisMedicos,
    
    CalculoProLaborePage: CalculoProLaborePage,
    
    ProducaoAdministrativaPage: ProducaoAdministrativaPage,
    
    RelatoriosPage: RelatoriosPage,
    
    DocumentacaoTecnica: DocumentacaoTecnica,
    
    ParametrosPDF: ParametrosPDF,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Componente principal que não usa Router (já está no App.jsx)
export default function Pages() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Medicos" element={<Medicos />} />
                
                <Route path="/Plantoes" element={<Plantoes />} />
                
                <Route path="/Empresas" element={<Empresas />} />
                
                <Route path="/Hospitais" element={<Hospitais />} />
                
                <Route path="/TiposPlantao" element={<TiposPlantao />} />
                
                <Route path="/Contratos" element={<Contratos />} />
                
                <Route path="/DescontosCreditos" element={<DescontosCreditos />} />
                
                <Route path="/VinculosMedicos" element={<VinculosMedicos />} />
                
                <Route path="/ProcedimentosParticulares" element={<ProcedimentosParticulares />} />
                
                <Route path="/GruposAcesso" element={<GruposAcesso />} />
                
                <Route path="/ProducaoAdministrativa" element={<ProducaoAdministrativa />} />
                
                <Route path="/ProLabores" element={<ProLabores />} />
                
                <Route path="/TabelasINSS" element={<TabelasINSS />} />
                
                <Route path="/TabelasIRRF" element={<TabelasIRRF />} />
                
                <Route path="/Usuarios" element={<Usuarios />} />
                
                <Route path="/ImportacaoExportacao" element={<ImportacaoExportacao />} />
                
                <Route path="/ParametrosFiscaisEmpresaPage" element={<ParametrosFiscaisEmpresaPage />} />
                
                <Route path="/CalculoProducaoPage" element={<CalculoProducaoPage />} />
                
                <Route path="/VinculosFiscaisMedicos" element={<VinculosFiscaisMedicos />} />
                
                <Route path="/CalculoProLaborePage" element={<CalculoProLaborePage />} />
                
                <Route path="/ProducaoAdministrativaPage" element={<ProducaoAdministrativaPage />} />
                
                <Route path="/RelatoriosPage" element={<RelatoriosPage />} />
                
                <Route path="/DocumentacaoTecnica" element={<DocumentacaoTecnica />} />
                
                <Route path="/ParametrosPDF" element={<ParametrosPDF />} />
                
            </Routes>
        </Layout>
    );
}


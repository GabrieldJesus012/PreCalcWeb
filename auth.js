import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://wzmuswrjobxbfmddqkda.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bXVzd3Jqb2J4YmZtZGRxa2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODk0OTIsImV4cCI6MjA5Mjg2NTQ5Mn0.3DptbVZS76WTOPOJTZeFbBz7XHVYGsBCsLIffd9xItc';

window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar sessão — checar os dois storages
const sessao = sessionStorage.getItem('precalc_user') || localStorage.getItem('precalc_user');

if (!sessao) {
    window.location.href = 'login.html';
} else {
    // Garantir que sessionStorage também tem (caso veio só do localStorage)
    sessionStorage.setItem('precalc_user', sessao);
    window.userAtual = JSON.parse(sessao);
}

window.sairDoSistema = function() {
    sessionStorage.removeItem('precalc_user');
    localStorage.removeItem('precalc_user');
    window.location.href = 'login.html';
};
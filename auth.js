// auth.js — carregar ANTES do script principal
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://wzmuswrjobxbfmddqkda.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bXVzd3Jqb2J4YmZtZGRxa2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODk0OTIsImV4cCI6MjA5Mjg2NTQ5Mn0.3DptbVZS76WTOPOJTZeFbBz7XHVYGsBCsLIffd9xItc';

window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar sessão
const sessao = sessionStorage.getItem('precalc_user');
if (!sessao) { window.location.href = 'login.html'; }
window.userAtual = JSON.parse(sessao || '{}');

// Sair
window.sairDoSistema = function() {
    sessionStorage.removeItem('precalc_user');
    window.location.href = 'login.html';
};
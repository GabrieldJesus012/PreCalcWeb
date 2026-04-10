function formatarMoeda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
    return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.valor-moeda').forEach(el => {
        const num = parseFloat(el.dataset.valor);
        if (!isNaN(num)) {
            el.textContent = formatarMoeda(num);
        }
    });
});
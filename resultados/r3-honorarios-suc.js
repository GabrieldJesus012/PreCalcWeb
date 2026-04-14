function gerarSecaoHonorariosSucumbenciais(resultados, dados) {
    if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
        !resultados.honorariosSucumbenciais?.honorarios?.length) {
        return '';
    }

    if (dados.honorarioSucumbencial?.advogados?.some(adv => adv.tipoHonorario === 'valorPrincipal')) {
        return '';
    }

    const honorarios = resultados.honorariosSucumbenciais.honorarios;
    const valorBaseSucumbencial = resultados.honorariosSucumbenciais.valorBaseSucumbencial;

    let totalHonorariosBrutos = 0;
    let linhas = '';

    honorarios.forEach(adv => {
        const temCessoes = adv.temCessoes && adv.cessionarios?.length > 0;

        const percentualExibicao = temCessoes
        ? `${(adv.percentual * adv.percentualAdvogado * 100).toFixed(2)}%`
        : adv.tipoHonorario === 'percentual'
            ? `${(adv.percentual * 100).toFixed(2)}%`
            : '100,00%';

        const valorBruto = adv.tipoHonorario === 'percentual'
            ? valorBaseSucumbencial * adv.percentual
            : valorBaseSucumbencial;

        totalHonorariosBrutos += valorBruto;

        const valorAdvogado = temCessoes 
            ? valorBruto * (adv.percentualAdvogado || 0)
            : valorBruto;

        linhas += `
            <tr>
                <td>${adv.nome} <small style="color:var(--sr-gray)">(${adv.tipo})</small></td>
                <td>R$ ${formatarMoeda(valorBaseSucumbencial)}</td>
                <td>${percentualExibicao}</td>
                <td>R$ ${formatarMoeda(valorAdvogado)}</td>
            </tr>
        `;

        if (temCessoes) {
            adv.cessionarios.forEach(c => {
                const valorCess = valorBruto * c.percentual;
                linhas += `
                    <tr style="background:#FEF5E7 !important;">
                        <td style="padding-left:28px; color:var(--sr-orange-dark);">
                            ↳ ${c.nome}
                            <small style="color:var(--sr-gray);">(Cessionário de ${adv.nome})</small>
                        </td>
                        <td style="color:var(--sr-gray); font-size:12px;">—</td>
                        <td style="color:var(--sr-orange-dark);">${(c.percentual * 100).toFixed(2)}%</td>
                        <td style="color:var(--sr-orange-dark);">R$ ${formatarMoeda(c.valorBruto || valorCess)}</td>
                    </tr>
                `;
            });
        }
    });

    return `
        <div class="table-container">
            <h3>💼 Honorários Sucumbenciais</h3>
            <table>
                <tr>
                    <th>Advogado / Cessionário</th>
                    <th>Base de Cálculo</th>
                    <th>Percentual</th>
                    <th>Valor Bruto</th>
                </tr>
                ${linhas}
                <tr class="highlight-green">
                    <td colspan="3"><strong>Total dos Honorários Sucumbenciais</strong></td>
                    <td><strong>R$ ${formatarMoeda(totalHonorariosBrutos)}</strong></td>
                </tr>
            </table>
        </div>
    `;
}
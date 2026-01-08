// ====================================
        // EXIBICAO DE RESULTADOS (HTML)
        // ====================================

        function exibirResultados(resultados, dados) {
            const container = document.getElementById('resultadosContent');
            const dataAtual = obterDataAtual();
            const { inicioGraca, fimGraca } = calcularPeriodoGraca(dados.anoOrcamento);
            
            const contexto = {
                dataAtual,
                inicioGraca,
                fimGraca,
                temHerdeiros: resultados.temHerdeiros && resultados.herdeiros.length > 0,
                somenteHonorarioSucumbencial: dados.somenteHonorarioSucumbencial
            };
            
            const html = contexto.somenteHonorarioSucumbencial 
                ? gerarVisualizacaoSucumbencial(resultados, dados, contexto)
                : gerarVisualizacaoCompleta(resultados, dados, contexto);
            
            container.innerHTML = html;
            navegarParaResultados();
        }

        function gerarVisualizacaoSucumbencial(resultados, dados, contexto) {
            return `
                ${gerarCabecalhoProcesso(dados, resultados, contexto.dataAtual)}
                ${gerarDemonstrativoValores(dados, resultados, contexto.dataAtual)}
                ${gerarCalculos(dados, resultados, contexto.inicioGraca, contexto.fimGraca)}
                ${gerarResumoCalculos(resultados, dados)}
                
                ${gerarSecaoHonorariosSucumbenciais(resultados, dados)}
                ${gerarSecaoCessoesHonorariosSucumbenciais(resultados, dados)}
                ${gerarSecaoPagamentosOcorridos(resultados, dados)}
                ${gerarDemonstrativoSaldoRemanescente(resultados)}
                ${gerarTabelaHonorariosSucumbenciais(resultados, dados)}
                ${gerarNotasTributacao()}
                
                ${gerarSecaoNotasExplicativas()}
                ${gerarBotaoImprimir()}
            `;
        }

        function gerarVisualizacaoCompleta(resultados, dados, contexto) {
            return `
                ${gerarCabecalhoProcesso(dados, resultados, contexto.dataAtual)}
                ${gerarDemonstrativoValores(dados, resultados, contexto.dataAtual)}
                ${gerarCalculos(dados, resultados, contexto.inicioGraca, contexto.fimGraca)}
                ${gerarResumoCalculos(resultados, dados)}
                
                ${gerarSecaoHonorariosSucumbenciais(resultados, dados)}
                ${gerarSecaoCessoesHonorariosSucumbenciais(resultados, dados)}
                ${gerarSecaoDeducoesAcessorias(resultados, dados)}
                ${gerarSecaoCessoesSindicatos(resultados, dados)}
                ${gerarSecaoCessoesAdvogados(resultados, dados)}
                ${gerarSecaoCessoesBeneficiario(resultados, dados)}
                ${contexto.temHerdeiros ? gerarSecaoHerdeiros(resultados, dados) : ''}
                ${gerarSecaoCessoesHerdeiros(resultados, dados)} 
                ${gerarSecaoPagamentosOcorridos(resultados, dados)}
                ${gerarDemonstrativoSaldoRemanescente(resultados)}
                ${gerarSecaoDeducoes(resultados, dados)}
                ${gerarSecoesPagamentos(resultados, dados)}
                
                ${gerarSecaoNotasExplicativas()}
                ${gerarBotaoImprimir()}
            `;
        }

        function gerarNotasTributacao() {
            return `
                <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                    <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nº 15.191, DE 11 DE AGOSTO DE 2025</p>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, ART 714</p>
                </div>
            `;
        }

        function navegarParaResultados() {
            showTab('tab7');
            setTimeout(() => {
                document.getElementById('tab7')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        }

        // ====================================
        // EXIBICAO DE RESULTADOS - Alguma fun. Aux (HTML)
        // ====================================

        function obterDataAtual() {
            const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
            const [ano, mes, dia] = dataAtualizacaoInput.split('-');
            return `${dia}/${mes}/${ano}`;
        }

        function formatarData(data) {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${meses[data.getMonth()]}/${data.getFullYear()}`;
        }

        function formatarMoeda(valor) {
            if (valor === null || valor === undefined || valor === '' || isNaN(valor)) {
                return '0,00';
            }
            
            const numeroValido = parseFloat(valor) || 0;
            return `${numeroValido.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }

        // ====================================
        // EXIBICAO DE RESULTADOS (HTML)
        // ====================================

        function gerarCabecalhoProcesso(dados, resultados, dataAtual) {
            const secaoRRA = (resultados.rraTotal && resultados.rraTotal !== 0)
                ? `<tr><td>Rendimentos Recebidos Acumuladamente Total (RRA):</td><td>${resultados.rraTotal} meses</td></tr>`
                : '';

            const tipos = {
                ordem: "Ordem Cronológica",
                preferencia: "Preferencial",
                acordo: "Acordo",
                parcial: "Parcial"
            };
            const tipoCalculo = tipos[dados.tipoCalculo] || "Não definido";

            const natureza = dados.natureza === 'alimentar' ? '⚖️ Alimentar' : '⚖️ Comum';

            let secaoDataBase = '<tr><td>Data-base do cálculo homologado na execução</td><td>Não informado</td></tr>';
            
            if (dados.valoresPrincipais && dados.valoresPrincipais.length > 0) {
                const datasUnicas = [...new Set(
                    dados.valoresPrincipais
                        .filter(item => item.mesBase && item.anoBase)
                        .map(item => `${item.mesBase}/${item.anoBase}`)
                )];
                
                if (datasUnicas.length > 0) {
                    const label = datasUnicas.length === 1 
                        ? 'Data-base do cálculo homologado na execução'
                        : 'Datas-base dos cálculos homologados';
                    secaoDataBase = `<tr><td>${label}</td><td>${datasUnicas.join(', ')}</td></tr>`;
                }
            }
            
            return `
                <div class="table-container">
                    <h3>📋 Identificação do Processo</h3>
                    <table>
                        <tr><th>Descrição</th><th>Informação</th></tr>
                        <tr><td>Número do Processo</td><td>${dados.numProcesso || 'Não informado'}</td></tr>
                        <tr><td>Ano do orçamento do Precatório</td><td>${dados.anoOrcamento || 'Não informado'}</td></tr>
                        <tr><td>Natureza do Processo</td><td>${natureza}</td></tr>
                        ${secaoRRA}
                        ${secaoDataBase}
                        <tr><td>Beneficiário Principal</td><td>${dados.beneficiario || 'Não informado'}</td></tr>
                        <tr><td>Devedor</td><td>${dados.credor || 'Não informado'}</td></tr>
                        <tr><td>Data do Cálculo</td><td>${dataAtual}</td></tr>
                        <tr><td>Tipo de Cálculo</td><td>${tipoCalculo}</td></tr>
                    </table>
                </div>
            `;
        }

        function gerarDemonstrativoValores(dados, resultados, dataAtual) {
            // Calcular valores originais totais - EXCLUINDO valores negativos
            const valorPrincipalOriginal = (dados.valoresPrincipais || [])
                .reduce((sum, item) => {
                    const valor = parseFloat(item.valorPrincipal) || 0;
                    return sum + (valor > 0 ? valor : 0);
                }, 0);
            
            const valorJurosOriginal = (dados.valoresPrincipais || [])
                .reduce((sum, item) => {
                    const valor = parseFloat(item.valorJuros) || 0;
                    return sum + (valor > 0 ? valor : 0);
                }, 0);
            
            const valorTotalOriginal = valorPrincipalOriginal + valorJurosOriginal;

            // ⬇️ CALCULAR ÍNDICES INDIVIDUAIS
            const indicePrincipal = valorPrincipalOriginal > 0 
                ? (resultados.valorprincatt / valorPrincipalOriginal).toFixed(6)
                : '1.000000';
            
            const indiceJuros = valorJurosOriginal > 0
                ? (resultados.valorjurosatt / valorJurosOriginal).toFixed(6)
                : '1.000000';
            
            const indiceTotal = valorTotalOriginal > 0
                ? (resultados.valortotatt / valorTotalOriginal).toFixed(6)
                : '1.000000';

            const datasUnicas = [...new Set(
                (dados.valoresPrincipais || [])
                    .filter(item => item.mesBase && item.anoBase)
                    .map(item => `${item.mesBase}/${item.anoBase}`)
            )];
            
            const textoDataBase = datasUnicas.length > 0 
                ? datasUnicas.join(', ') 
                : 'Não informado';

            // VERIFICAR SE TEM SELIC SEPARADA
            const valorSelicTotal = resultados.valorSelicatt || 0;
            const temSelic = valorSelicTotal > 0;

            return `
                <div class="table-container">
                    <h3>💰 Demonstrativo de Atualização Monetária</h3>
                    <table>
                        <tr>
                            <th>Componente</th>
                            <th>Valor Histórico (${textoDataBase})</th>
                            <th>Índice de Correção*</th>
                            <th>Valor Atualizado (${dataAtual})</th>
                        </tr>
                        <tr>
                            <td>Principal</td>
                            <td>R$ ${formatarMoeda(valorPrincipalOriginal)}</td>
                            <td>${indicePrincipal}</td>
                            <td>R$ ${formatarMoeda(resultados.valorprincatt)}</td>
                        </tr>
                        <tr>
                            <td>Juros</td>
                            <td>R$ ${formatarMoeda(valorJurosOriginal)}</td>
                            <td>${indiceJuros}</td>
                            <td>R$ ${formatarMoeda(resultados.valorjurosatt)}</td>
                        </tr>
                        ${temSelic ? `
                        <tr>
                            <td>Selic</td>
                            <td>-</td>
                            <td>-</td>
                            <td>R$ ${formatarMoeda(valorSelicTotal)}</td>
                        </tr>
                        ` : ''}
                        <tr class="highlight">
                            <td><strong>Total Atualizado</strong></td>
                            <td><strong>R$ ${formatarMoeda(valorTotalOriginal)}</strong></td>
                            <td><strong>${indiceTotal}</strong></td>
                            <td><strong>R$ ${formatarMoeda(resultados.valortotatt)}</strong></td>
                        </tr>
                    </table>
                    <div class="success-box" style="margin-top: 15px; padding: 10px; border-radius: 4px;">
                        *Atualização Monetária conforme Resolução CNJ nº 303/2019, com índices de correção monetária, conforme caput do Art.21- A e  Emenda Constitucional nº 62 e 113, art. 3º. - <strong>Período de Correção</strong>: Os valores foram atualizados desde a base <strong>${textoDataBase}</strong> até <strong>${dataAtual}</strong>.
                    </div>
                </div>
            `;
        }

        //HTML DA PARTE DE CALCULO

        function gerarCalculos(dados, resultados, inicioGraca, fimGraca) {
            const inicioGracaFormatado = formatarData(inicioGraca);
            const fimGracaFormatado = formatarData(fimGraca);
            
            const temSelicInformado = dados.valoresPrincipais?.some(item => 
                (item.tipoSelic === 'valor' && item.valorSelic > 0) || 
                (item.tipoSelic === 'percentual' && item.percentualSelic > 0)
            );

            const temJurosMora = dados.valoresPrincipais?.some(item => 
                item.indices.jurosMora && (resultados.itensCalculados?.find(calc => calc.id === item.id)?.jurosMoraCalculado || 0) > 0
            );
            
            let memoriaisCalculos = '';
            
            if (dados.valoresPrincipais && dados.valoresPrincipais.length > 0) {
                const isSingleItem = dados.valoresPrincipais.length === 1;
                
                dados.valoresPrincipais.forEach((item, index) => {
                    const itemCalculado = resultados.itensCalculados?.find(calc => calc.id === item.id) || {};
                    memoriaisCalculos += gerarMemorialItem(item, itemCalculado, index, isSingleItem, inicioGracaFormatado, fimGracaFormatado);
                });
            }

            const notaSelicInformado = temSelicInformado 
                ? gerarNotaSelicInformado(dados, resultados)
                : '';
            
            return `
                ${memoriaisCalculos}
                ${(notaSelicInformado || temJurosMora) ? `
                <div class="success-box" style="margin-top: 15px; padding: 10px; border-radius: 4px;">
                    ${notaSelicInformado}${temJurosMora ? '*Juros calculados de forma simples (até Novembro/2021), conforme art. 1º da Lei nº 12.703/2012; art. 1º, "F", da Lei nº 9.494/1997; art. 100, § 12º da CF/88, Art.22 da Resolução 303 do CNJ, SV nº 17 do STF e a partir de 01.08.2025 juros de 2% ao ano (quando aplicável).' : ''}
                </div>` : ''}
            `;
        }

        // ========== FUNÇÕES AUXILIARES DE GERAR CALCULOS==========

        function gerarMemorialItem(item, itemCalculado, index, isSingleItem, inicioGracaFormatado, fimGracaFormatado) {
            const indices = obterIndicesItem(itemCalculado);
            const valoresCalculados = calcularValoresPassoAPasso(item, itemCalculado, indices);
            
            const titulo = isSingleItem ? 
                '🔢 MEMORIAL DE CÁLCULOS' : 
                `🔢 MEMORIAL DE CÁLCULOS - ${item.descricao || `Item ${index + 1}`}`;
            
            const detalhesItem = isSingleItem ? '' : `
                <div style="background: #f0f0f0; padding: 10px; margin-bottom: 15px; border-radius: 5px;">
                    <strong>Base:</strong> ${item.mesBase}/${item.anoBase} | 
                    <strong>Índices aplicados:</strong> ${Object.entries(item.indices || {})
                        .filter(([key, value]) => value)
                        .map(([key]) => key.toUpperCase())
                        .join(', ')}
                </div>
            `;
            
            // ⬇️ USAR valoresCalculados.valorSelicFinal
            const valorSelicFinal = valoresCalculados.valorSelicFinal || 0;
            const totalItem = (valoresCalculados.principalFinal || 0) + 
                            (valoresCalculados.jurosFinal || 0) + 
                            valorSelicFinal;
            
            const totalDoItem = isSingleItem ? '' : `
                <div class="highlight" style="margin-top: 10px; padding: 10px; background: #e8f4fd; border-radius: 5px;">
                    <strong>TOTAL DESTE ITEM:</strong> 
                    R$ ${formatarMoeda(valoresCalculados.principalFinal)} + 
                    R$ ${formatarMoeda(valoresCalculados.jurosFinal)}${valorSelicFinal > 0 ? ` + R$ ${formatarMoeda(valorSelicFinal)} (SELIC)` : ''} = 
                    <strong>R$ ${formatarMoeda(totalItem)}</strong>
                </div>
            `;

            const temAlgumJuros = (item.valorJuros && parseFloat(item.valorJuros) !== 0) || 
                                (item.indices.jurosMora && valoresCalculados.valorJurosMora !== 0);

            return `
                <div class="table-container" style="margin-top: 20px;">
                    <h3>${titulo}</h3>
                    ${detalhesItem}
                    
                    ${gerarTabelaPrincipal(item, indices, valoresCalculados, inicioGracaFormatado, fimGracaFormatado, itemCalculado)}
                    
                    ${temAlgumJuros ? gerarTabelaJuros(item, indices, valoresCalculados, inicioGracaFormatado, fimGracaFormatado, itemCalculado) : ''}
                    
                    ${valorSelicFinal > 0 ? gerarTabelaSelic(itemCalculado, valoresCalculados) : ''}
                    
                    ${totalDoItem}
                </div>
            `;
        }

        function obterIndicesItem(itemCalculado) {
            return {
                cnj: itemCalculado.indices?.cnj || 1,
                selic: itemCalculado.indices?.selic || 1,
                ipcae: itemCalculado.indices?.ipcae || 1,
                ipca: itemCalculado.indices?.ipca || 1,
                jurosMora: itemCalculado.indices?.jurosMora || 0
            };
        }

        function calcularValoresPassoAPasso(item, itemCalculado, indices) {
            const detalhePEC = itemCalculado.detalhamentoPEC || {};
            const usaLogicaPEC = detalhePEC.usouLogicaPEC && detalhePEC.selicMaior;
            
            // PRINCIPAL - PASSO A PASSO

            const principalCNJ = item.valorPrincipal * indices.cnj;
            const principalIPCAE = principalCNJ * indices.ipcae;
            
            let principalSelic, principalIPCA, principalFinal;
            
            if (usaLogicaPEC) {
                // LÓGICA PEC: IPCA aplicado depois, SELIC fica separada
                principalSelic = principalIPCAE * indices.selic;  // Usado apenas para cálculo da SELIC separada
                principalIPCA = principalIPCAE * (detalhePEC.indiceIpcaPuro || 1);
                principalFinal = principalIPCA;
            } else {
                // LÓGICA ANTIGA: SELIC aplicada diretamente
                principalSelic = principalIPCAE * indices.selic;
                principalIPCA = principalSelic;  // Não tem IPCA separado
                principalFinal = principalSelic;
            }
            
            // JUROS - PASSO A PASSO
            
            const jurosOriginaisCNJ = item.valorJuros * indices.cnj;
            const valorJurosMora = itemCalculado.jurosMoraCalculado || 0;
            const totalJuros = jurosOriginaisCNJ + valorJurosMora;
            const totalJurosIPCAE = totalJuros * indices.ipcae;
            
            let totalJurosSelic, totalJurosIPCA, juros2AA, jurosFinal;
            
            if (usaLogicaPEC) {
                // LÓGICA PEC: IPCA + Juros 2% a.a.
                totalJurosSelic = totalJurosIPCAE * indices.selic;  // Usado para cálculo da SELIC separada
                totalJurosIPCA = totalJurosIPCAE * (detalhePEC.indiceIpcaPuro || 1);
                juros2AA = detalhePEC.valorJuros2AA || 0;
                jurosFinal = totalJurosIPCA + juros2AA;
            } else {
                // LÓGICA ANTIGA: SELIC aplicada diretamente
                totalJurosSelic = totalJurosIPCAE * indices.selic;
                totalJurosIPCA = totalJurosSelic;  // Não tem IPCA separado
                juros2AA = 0;
                jurosFinal = totalJurosSelic;
            }
            
            // SELIC SEPARADA (apenas na lógica PEC)
            
            let valorSelicBase, valorSelicIPCA, valorSelicFinal;
            
            if (usaLogicaPEC) {
                // Base da SELIC = (Principal + Juros) após IPCA-E, antes de IPCA
                const baseAntesSelic = principalIPCAE + totalJurosIPCAE;
                
                // SELIC aplicada sobre a base
                valorSelicBase = baseAntesSelic * (indices.selic - 1);
                
                // IPCA aplicado sobre a SELIC
                valorSelicIPCA = valorSelicBase * (detalhePEC.indiceIpcaPuro || 1);
                valorSelicFinal = valorSelicIPCA;
            } else {
                valorSelicBase = 0;
                valorSelicIPCA = 0;
                valorSelicFinal = 0;
            }
            
            return {
                // Principal
                principalCNJ,
                principalIPCAE,
                principalSelic,      // Intermediário (lógica antiga) ou base para SELIC (PEC)
                principalIPCA,       // Apenas na PEC
                principalFinal,
                
                // Juros
                jurosOriginaisCNJ,
                valorJurosMora,
                totalJuros,
                totalJurosIPCAE,
                totalJurosSelic,     // Intermediário (lógica antiga) ou base para SELIC (PEC)
                totalJurosIPCA,      // Apenas na PEC
                juros2AA,            // Apenas na PEC
                jurosFinal,
                
                // SELIC Separada (apenas PEC)
                valorSelicBase,      // SELIC antes do IPCA
                valorSelicIPCA,      // SELIC com IPCA aplicado
                valorSelicFinal,     // Valor final da SELIC separada
                
                // Flags
                usaLogicaPEC
            };
        }

        function gerarTabelaPrincipal(item, indices, valores, inicioGracaFormatado, fimGracaFormatado, itemCalculado) {
            const detalhePEC = itemCalculado.detalhamentoPEC || {};
            
            return `
                <h4>💰 Atualização do Principal - Passo a Passo</h4>
                <table>
                    <tr><th>Etapa</th><th>Cálculo</th><th>Valor</th></tr>
                    <tr>
                        <td>1. Valor Original</td>
                        <td>Principal Homologado</td>
                        <td>R$ ${formatarMoeda(item.valorPrincipal)}</td>
                    </tr>
                    ${item.indices.cnj ? `
                    <tr>
                        <td>2. Correção CNJ</td>
                        <td>R$ ${formatarMoeda(item.valorPrincipal)} × ${indices.cnj.toFixed(6)}</td>
                        <td>R$ ${formatarMoeda(valores.principalCNJ)}</td>
                    </tr>` : ''}
                    ${item.indices.ipcae ? `
                    <tr>
                        <td>3. Aplicação IPCA-E (graça - ${inicioGracaFormatado} - ${fimGracaFormatado})</td>
                        <td>R$ ${formatarMoeda(valores.principalCNJ)} × ${indices.ipcae.toFixed(6)}</td>
                        <td>R$ ${formatarMoeda(valores.principalIPCAE)}</td>
                    </tr>` : ''}
                    ${valores.usaLogicaPEC ? `
                    <tr>
                        <td>4. Aplicação IPCA (pós agosto/2025)</td>
                        <td>R$ ${formatarMoeda(valores.principalIPCAE)} × ${indices.ipca.toFixed(6)}</td>
                        <td><strong>R$ ${formatarMoeda(valores.principalIPCA)}</strong></td>
                    </tr>
                    <tr style="background: #fff3cd;">
                        <td colspan="3" style="text-align: center; font-size: 0.9em;">
                            ⚠️ <strong>SELIC aplicada separadamente</strong> - Ver seção específica abaixo
                        </td>
                    </tr>` : item.indices.selic ? `
                    <tr>
                        <td>4. Aplicação SELIC (excluído a graça)</td>
                        <td>R$ ${formatarMoeda(valores.principalIPCAE)} × ${indices.selic.toFixed(6)}</td>
                        <td><strong>R$ ${formatarMoeda(valores.principalFinal)}</strong></td>
                    </tr>` : `
                    <tr>
                        <td>Final</td>
                        <td>Valor Final do Principal</td>
                        <td><strong>R$ ${formatarMoeda(valores.principalFinal)}</strong></td>
                    </tr>`}
                </table>
            `;
        }

        function gerarTabelaJuros(item, indices, valores, inicioGracaFormatado, fimGracaFormatado, itemCalculado) {
            let etapa = 2;
            
            const detalhePEC = itemCalculado.detalhamentoPEC || {};
            const quantidadeMeses = detalhePEC.quantidadeMeses || 0;
            
            return `
                <h4>⚖️ Atualização dos Juros - Passo a Passo</h4>
                <table>
                    <tr><th>Etapa</th><th>Cálculo</th><th>Valor</th></tr>
                    <tr>
                        <td>1. Juros Originais</td>
                        <td>Juros Homologado</td>
                        <td>R$ ${formatarMoeda(item.valorJuros)}</td>
                    </tr>
                    ${item.indices.cnj ? `
                    <tr>
                        <td>${etapa++}. Correção CNJ</td>
                        <td>R$ ${formatarMoeda(item.valorJuros)} × ${indices.cnj.toFixed(6)}</td>
                        <td>R$ ${formatarMoeda(valores.jurosOriginaisCNJ)}</td>
                    </tr>` : ''}
                    ${item.indices.jurosMora && valores.valorJurosMora > 0 ? `
                    <tr>
                        <td>${etapa++}. Juros de Mora - Poupança</td>
                        <td>Principal CNJ × ${(indices.jurosMora * 100).toFixed(4)}%*</td>
                        <td>R$ ${formatarMoeda(valores.valorJurosMora)}</td>
                    </tr>
                    <tr>
                        <td>${etapa++}. Total Juros (CNJ + Mora)</td>
                        <td>R$ ${formatarMoeda(valores.jurosOriginaisCNJ)} + R$ ${formatarMoeda(valores.valorJurosMora)}</td>
                        <td>R$ ${formatarMoeda(valores.totalJuros)}</td>
                    </tr>` : ''}
                    ${item.indices.ipcae ? `
                    <tr>
                        <td>${etapa++}. Aplicação IPCA-E (graça - ${inicioGracaFormatado} - ${fimGracaFormatado})</td>
                        <td>R$ ${formatarMoeda(valores.totalJuros)} × ${indices.ipcae.toFixed(6)}</td>
                        <td>R$ ${formatarMoeda(valores.totalJurosIPCAE)}</td>
                    </tr>` : ''}
                    ${valores.usaLogicaPEC ? `
                    <tr>
                        <td>${etapa++}. Aplicação IPCA (pós agosto/2025)</td>
                        <td>R$ ${formatarMoeda(valores.totalJurosIPCAE)} × ${indices.ipca.toFixed(6)}</td>
                        <td>R$ ${formatarMoeda(valores.totalJurosIPCA)}</td>
                    </tr>
                    <tr>
                        <td>${etapa++}. Juros (2% a.a.) - ${quantidadeMeses} meses</td>
                        <td> Principal × ${(detalhePEC.percentualJuros2AA * 100).toFixed(6)}%</td>
                        <td>R$ ${formatarMoeda(valores.juros2AA)}</td>
                    </tr>
                    <tr>
                        <td>${etapa++}. Total Juros</td>
                        <td>R$ ${formatarMoeda(valores.totalJurosIPCA)} + R$ ${formatarMoeda(valores.juros2AA)}</td>
                        <td><strong>R$ ${formatarMoeda(valores.jurosFinal)}</strong></td>
                    </tr>
                    <tr style="background: #fff3cd;">
                        <td colspan="3" style="text-align: center; font-size: 0.9em;">
                            ⚠️ <strong>SELIC aplicada separadamente</strong> - Ver seção específica abaixo
                        </td>
                    </tr>` : item.indices.selic ? `
                    <tr>
                        <td>${etapa++}. Aplicação SELIC (excluído a graça)</td>
                        <td>R$ ${formatarMoeda(valores.totalJurosIPCAE)} × ${indices.selic.toFixed(6)}</td>
                        <td><strong>R$ ${formatarMoeda(valores.jurosFinal)}</strong></td>
                    </tr>` : `
                    <tr>
                        <td>Final</td>
                        <td>Valor Final dos Juros</td>
                        <td><strong>R$ ${formatarMoeda(valores.jurosFinal)}</strong></td>
                    </tr>`}
                </table>
            `;
        }

        function gerarTabelaSelic(itemCalculado, valores) {
            if (!valores.usaLogicaPEC || valores.valorSelicFinal === 0) {
                return ''; // Não mostra se não usa lógica PEC
            }
            
            const indices = itemCalculado.indices || {};
            const baseAntesSelic = valores.principalIPCAE + valores.totalJurosIPCAE;
            
            return `
                <h4>📊 SELIC - Passo a Passo</h4>
                <table>
                    <tr><th>Etapa</th><th>Cálculo</th><th>Valor</th></tr>
                    <tr>
                        <td>1. Base para SELIC</td>
                        <td>Principal + Juros em 31/07/2025 </td>
                        <td>R$ ${formatarMoeda(baseAntesSelic)}</td>
                    </tr>
                    <tr>
                        <td>2. Aplicação SELIC (até 31/07/2025)</td>
                        <td>Base × ${((indices.selic - 1) * 100).toFixed(4)}%</td>
                        <td>R$ ${formatarMoeda(valores.valorSelicBase)}</td>
                    </tr>
                    <tr>
                        <td>3. Aplicação IPCA (pós agosto/2025)</td>
                        <td>SELIC × ${indices.ipca?.toFixed(6) || '1.000000'}</td>
                        <td><strong>R$ ${formatarMoeda(valores.valorSelicFinal)}</strong></td>
                    </tr>
                </table>
            `;
        }

        function gerarNotaSelicInformado(dados, resultados) {
            const itensComSelic = dados.valoresPrincipais.filter(item => 
                (item.tipoSelic === 'valor' && item.valorSelic > 0) || 
                (item.tipoSelic === 'percentual' && item.percentualSelic > 0)
            );
            
            const notasItens = itensComSelic.map(item => {
                const itemCalculado = resultados.itensCalculados?.find(calc => calc.id === item.id) || {};
                const indiceSelic = itemCalculado.indices?.selic || 1;
                
                const percentualTotal = ((indiceSelic - 1) * 100).toFixed(2);
                
                // Calcular percentual informado
                let percentualInformado;
                if (item.tipoSelic === 'valor') {
                    const totalBase = item.valorPrincipal + item.valorJuros;
                    percentualInformado = totalBase > 0 ? ((item.valorSelic / totalBase) * 100).toFixed(4) : 0;
                } else {
                    percentualInformado = (item.percentualSelic * 100).toFixed(2);
                }
                
                const percentualAutomatico = (parseFloat(percentualTotal) - parseFloat(percentualInformado)).toFixed(2);
                
                // Calcular período
                const dataBase = criarDataBase(item.mesBase, item.anoBase);
                const dataInicio = new Date(dataBase);
                if (item.mesReferenciaSelic !== 'mesAnterior') {
                    dataInicio.setMonth(dataInicio.getMonth() + 1);
                }

                const dataAtualizacaoInput = document.getElementById('dataatualizacao').value;
                const dataFim = new Date(dataAtualizacaoInput);
                
                const periodoInicio = `${String(dataInicio.getMonth() + 1).padStart(2, '0')}/${dataInicio.getFullYear()}`;
                const periodoFim = `${String(dataFim.getMonth() + 1).padStart(2, '0')}/${dataFim.getFullYear()}`;
                
                return `SELIC: ${percentualInformado}% Cálculo Homologado (${item.mesBase}/${item.anoBase}) +  ${percentualAutomatico}% (${periodoInicio} a ${periodoFim}) = ${percentualTotal}% total`;
            }).join('; ');
            
            return `*${notasItens}.<br>`;
        }

        // RESUMO DO CALCULO

        function gerarResumoCalculos(resultados, dados) {
            const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;
            const temTributacaoMista = resultados.tributacaoIR?.isento > 0 && 
                                    resultados.tributacaoIR?.principalTributado > 0;
            
            // ⬇️ VERIFICAR SE TEM SELIC SEPARADA
            const valorSelicTotal = resultados.valorSelicatt || 0;
            const temSelic = valorSelicTotal > 0;
            const percentualSelic = temSelic ? (resultados.percentualselic || 0) : 0;

            // Linhas principais (sempre aparecem)
            const linhasPrincipais = `
                <tr>
                    <td>Valor Principal Atualizado</td>
                    <td>R$ ${formatarMoeda(resultados.valorprincatt)}</td>
                    <td>${(resultados.percentualprinc * 100).toFixed(4)}%</td>
                </tr>
                ${temTributacaoMista ? `
                <tr style="color: #666; font-size: 0.92em;">
                    <td style="padding-left: 20px;">↳ Principal Tributável</td>
                    <td>↳ R$ ${formatarMoeda(resultados.tributacaoIR.principalTributado)} (${((resultados.tributacaoIR.principalTributado / resultados.valortotatt) * 100).toFixed(4)}%)</td>
                    <td>-</td>
                </tr>
                ` : ''}
                <tr>
                    <td>Valor Juros Atualizado</td>
                    <td>R$ ${formatarMoeda(resultados.valorjurosatt)}</td>
                    <td>${(resultados.percentualjur * 100).toFixed(4)}%</td>
                </tr>
                ${temSelic ? `
                <tr>
                    <td>Valor Selic Atualizado </td>
                    <td>R$ ${formatarMoeda(valorSelicTotal)}</td>
                    <td>${(percentualSelic * 100).toFixed(4)}%</td>
                </tr>
                ` : ''}
            `;

            // Base de pagamento (varia conforme o tipo)
            let basesPagamento = '';

            if (dados.somenteHonorarioSucumbencial && dados.tipoCalculo === 'parcial') {
                // Caso 1: Honorário sucumbencial em pagamento parcial
                basesPagamento = `
                    <tr class="highlight">
                        <td><strong>Valor Disponível para Pagamento</strong></td>
                        <td><strong>R$ ${formatarMoeda(dados.saldoParcial)}</strong></td>
                        <td><strong>100,00%</strong></td>
                    </tr>
                `;
            } else if (temHerdeiros && dados.tipoCalculo === 'preferencia') {
                // Caso 2: Preferência com herdeiros
                const herdeirosPreferenciais = resultados.herdeiros.filter(h => h.temPreferencia);
                
                if (herdeirosPreferenciais.length > 0) {
                    basesPagamento = `
                        <tr class="highlight">
                            <td colspan="3"><strong>Base para Pagamento</strong></td>
                        </tr>
                        ${herdeirosPreferenciais.map(h => `
                            <tr class="highlight">
                                <td><strong>${h.nome}</strong></td>
                                <td><strong>R$ ${formatarMoeda(h.valorTotal)}</strong></td>
                                <td><strong>${((h.valorTotal / resultados.valortotatt) * 100).toFixed(2)}%</strong></td>
                            </tr>
                        `).join('')}
                    `;
                }
            } else {
                // Caso 3: Ordem cronológica ou sem herdeiros
                basesPagamento = `
                    <tr class="highlight">
                        <td><strong>Base para Pagamento</strong></td>
                        <td><strong>R$ ${formatarMoeda(resultados.valorBase)}</strong></td>
                        <td><strong>${((resultados.valorBase / resultados.valortotatt) * 100).toFixed(2)}%</strong></td>
                    </tr>
                `;
            }

            // ⬇️ CALCULAR PERCENTUAL TOTAL CORRETO
            const percentualTotal = (resultados.percentualprinc + resultados.percentualjur + percentualSelic) * 100;

            return `
                <div class="table-container">
                    <h3>📈 Resumo dos Cálculos</h3>
                    <table>
                        <tr><th>Descrição</th><th>Valor</th><th>%</th></tr>
                        ${linhasPrincipais}
                        <tr>
                            <td><strong>Total Atualizado</strong></td>
                            <td><strong>R$ ${formatarMoeda(resultados.valortotatt)}</strong></td>
                            <td><strong>${percentualTotal.toFixed(2)}%</strong></td>
                        </tr>
                        ${basesPagamento}
                    </table>
                </div>
            `;
        }

        //Honorarios sucumbencias

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
            
            const linhasAdvogados = honorarios.map(adv => {
                const percentualExibicao = adv.tipoHonorario === 'percentual' 
                    ? `${(adv.percentual * 100).toFixed(2)}%`
                    : '100,00%';
                
                const valorBruto = adv.tipoHonorario === 'percentual'
                    ? valorBaseSucumbencial * adv.percentual
                    : valorBaseSucumbencial;
                
                totalHonorariosBrutos += valorBruto;
                
                return `
                    <tr>
                        <td>${adv.nome}</td>
                        <td>R$ ${formatarMoeda(valorBaseSucumbencial)}</td>
                        <td>${percentualExibicao}</td>
                        <td>R$ ${formatarMoeda(valorBruto)}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="table-container">
                    <h3>💼 Honorários Sucumbenciais</h3>
                    
                    <table>
                        <tr>
                            <th>Advogado</th>
                            <th>Base de Cálculo</th>
                            <th>Percentual</th>
                            <th>Valor Bruto</th>
                        </tr>
                        ${linhasAdvogados}
                        <tr class="highlight">
                            <td colspan="3"><strong>Total dos Honorários Sucumbenciais</strong></td>
                            <td><strong>R$ ${formatarMoeda(totalHonorariosBrutos)}</strong></td>
                        </tr>
                    </table>
                </div>
            `;
        }

        //Cessoes de sucumbencias

        function gerarSecaoCessoesHonorariosSucumbenciais(resultados, dados) {
            if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
                !resultados.honorariosSucumbenciais?.honorarios?.length) {
                return '';
            }

            const honorarios = resultados.honorariosSucumbenciais.honorarios;
            const valorBaseSucumbencial = resultados.honorariosSucumbenciais.valorBaseSucumbencial;
            
            const advogadosComCessoes = honorarios.filter(adv => adv.temCessoes && adv.cessionarios?.length > 0);
            
            if (advogadosComCessoes.length === 0) {
                return '';
            }

            const secoesCessoes = advogadosComCessoes.map(adv => {
                // Calcular valor bruto do honorário
                const valorHonorarioTotal = adv.tipoHonorario === 'percentual'
                    ? valorBaseSucumbencial * adv.percentual
                    : valorBaseSucumbencial;

                // Dados de cessão
                const totalCedido = adv.percentualCessionarioAdv || 0;
                const percentualAdvogado = adv.percentualAdvogado || (1 - totalCedido);
                const valorAdvogado = valorHonorarioTotal * percentualAdvogado;
                const listaCessionarios = adv.cessionarios?.map(c => c.nome).join(', ') || '';

                // Linha do advogado
                const linhaAdvogado = `
                    <tr>
                        <td>${adv.nome}</td>
                        <td>${(percentualAdvogado * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorAdvogado)}</td>
                    </tr>
                `;

                // Linhas dos cessionários
                const linhasCessionarios = (adv.cessionarios || []).map(cessionario => {
                    const valorCessionario = valorHonorarioTotal * cessionario.percentual;
                    return `
                        <tr>
                            <td>${cessionario.nome} (Cessionário)</td>
                            <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                            <td>R$ ${formatarMoeda(valorCessionario)}</td>
                        </tr>
                    `;
                }).join('');

                const textoHonorario = dados.tipoCalculo === 'parcial' 
                    ? `Valor do Honorário (Parcial): R$ ${formatarMoeda(valorHonorarioTotal)}`
                    : `Valor do Honorário: R$ ${formatarMoeda(valorHonorarioTotal)}`;

                return `
                    <div style="margin-bottom: 30px;">
                        <h4>Cessão do Advogado Sucumbencial: ${adv.nome}</h4>
                        <p><strong>${textoHonorario}</strong></p>
                        <p><strong>Cedido:</strong> ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</p>
                        
                        <table>
                            <tr>
                                <th>Recebedor</th>
                                <th>Percentual</th>
                                <th>Valor do Direito</th>
                            </tr>
                            ${linhaAdvogado}
                            ${linhasCessionarios}
                            <tr class="highlight">
                                <td colspan="2"><strong>Total</strong></td>
                                <td><strong>R$ ${formatarMoeda(valorHonorarioTotal)}</strong></td>
                            </tr>
                        </table>
                    </div>
                `;
            }).join('');

            return `
                <div class="table-container">
                    <h3>🔄 Cessões de Honorários Sucumbenciais</h3>
                    ${secoesCessoes}
                </div>
            `;
        }

        // Deducoes acessorias - Honorarios e Sindicatos

        function gerarSecaoDeducoesAcessorias(resultados, dados) {
            const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;
            const temSindicatos = resultados.sindicatos && resultados.sindicatos.length > 0;
            
            const { temHonorarios, honorariosParaMostrar } = obterHonorariosParaExibir(resultados, temHerdeiros);
            
            if (!temSindicatos && !temHonorarios) return '';

            const secaoSindicatos = temSindicatos 
                ? gerarSecaoSindicatos(resultados, dados) 
                : '';
            
            const secaoHonorarios = (temHonorarios && honorariosParaMostrar.length > 0)
                ? gerarSecaoHonorarios(resultados, dados, honorariosParaMostrar, temHerdeiros)
                : '';

            return `
                <div class="deducoes-acessorias">
                    <div class="table-container">
                        <h3>📄➖ Deduções Acessórias</h3>
                        <div class="explicacao-juridica">
                            <div class="titulo">Entenda as Deduções Acessórias</div>
                            <p><strong>Contribuições Sindicais:</strong> Percentual devido aos sindicatos quando aplicável.</p>
                            <p><strong>Honorários Advocatícios:</strong> Percentual devido aos advogados conforme contrato.</p>
                        </div>
                        ${secaoSindicatos}
                        ${secaoHonorarios}
                    </div>
                </div>
            `;
        }

        // ========== FUNÇÕES AUXILIARES DAS DEDUCOES==========

        function obterHonorariosParaExibir(resultados, temHerdeiros) {
            let honorariosParaMostrar = [];
            let temHonorarios = false;

            if (temHerdeiros) {
                // Extrair honorários únicos de todos os herdeiros
                const honorariosMap = new Map();
                
                resultados.herdeiros.forEach(h => {
                    if (h.honorarios && h.honorarios.length > 0) {
                        h.honorarios.forEach(a => {
                            if (!honorariosMap.has(a.nome)) {
                                honorariosMap.set(a.nome, {
                                    nome: a.nome,
                                    tipo: a.tipo,
                                    percentual: a.percentual
                                });
                            }
                        });
                    }
                });
                
                honorariosParaMostrar = Array.from(honorariosMap.values());
                temHonorarios = honorariosParaMostrar.length > 0;
            } else {
                temHonorarios = resultados.honorarios && resultados.honorarios.length > 0;
                honorariosParaMostrar = resultados.honorarios || [];
            }

            return { temHonorarios, honorariosParaMostrar };
        }

        function gerarSecaoSindicatos(resultados, dados) {
            const isParcial = dados.tipoCalculo === 'parcial';
            const baseCalculoSindicato = isParcial ? resultados.valorBase : resultados.valortotatt;
            
            const linhasSindicatos = resultados.sindicatos.map(s => `
                <tr>
                    <td>${s.nome}</td>
                    <td>R$ ${formatarMoeda(baseCalculoSindicato)}</td>
                    <td>${(s.percentual * 100).toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(s.valorBruto)}</td>
                </tr>
            `).join('');
            
            const totalSindicatos = resultados.sindicatos.reduce((sum, s) => sum + s.valorBruto, 0);
            
            return `
                <h3>🏛️ Sindicatos</h3>
                <table>
                    <tr><th>Nome Sindicato</th><th>Base de Cálculo</th><th>Percentual</th><th>Valor Bruto</th></tr>
                    ${linhasSindicatos}
                    <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                        <td colspan="3"><strong>TOTAL SINDICATOS</strong></td>
                        <td><strong>R$ ${formatarMoeda(totalSindicatos)}</strong></td>
                    </tr>
                </table>
            `;
        }

        function gerarSecaoHonorarios(resultados, dados, honorariosParaMostrar, temHerdeiros) {
            const baseGroups = agruparPorBaseCalculo(resultados, dados, temHerdeiros);
            
            const secoes = [];
            
            baseGroups.forEach((herdeiros, base) => {
                const valorBase = (base === 'PRINCIPAL') ? herdeiros[0].valorTotal : parseFloat(base);
                const herdeirosNomes = herdeiros.map(h => h.nome).join(', ');
                
                const titulo = dados.tipoCalculo === 'preferencia' && valorBase < resultados.valortotatt
                    ? '👩‍💼 Advogados (H.Contratuais) - Honorários da Preferência'
                    : '👩‍💼 Advogados (H.Contratuais)';

                const linhasAdvogados = honorariosParaMostrar.map(a => `
                    <tr>
                        <td>${a.nome}</td>
                        <td>${a.tipo}</td>
                        <td>R$ ${formatarMoeda(valorBase)}</td>
                        <td>${(a.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorBase * a.percentual)}</td>
                    </tr>
                `).join('');

                const totalPercentual = honorariosParaMostrar.reduce((sum, h) => sum + h.percentual, 0);
                const totalValor = valorBase * totalPercentual;

                secoes.push(`
                    <h3>${titulo}</h3>
                    <p style="color: #155724; font-style: italic;">
                        Valores calculados sobre: R$ ${formatarMoeda(valorBase)}
                        <span style="color: #856404;"> - ${herdeirosNomes}</span>
                    </p>
                    <table>
                        <tr><th>Nome Advogado</th><th>PF/PJ</th><th>Base de Cálculo</th><th>Percentual</th><th>Valor Bruto</th></tr>
                        ${linhasAdvogados}
                        <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                            <td colspan="3"><strong>TOTAL HONORÁRIOS</strong></td>
                            <td><strong>${(totalPercentual * 100).toFixed(2)}%</strong></td>
                            <td><strong>R$ ${formatarMoeda(totalValor)}</strong></td>
                        </tr>
                    </table>
                `);
            });

            return secoes.join('');
        }

        function agruparPorBaseCalculo(resultados, dados, temHerdeiros) {
            const baseGroups = new Map();

            if (temHerdeiros) {
                // Filtrar herdeiros por preferência se necessário
                const herdeirosFiltrados = dados.tipoCalculo === 'preferencia'
                    ? resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial)
                    : resultados.herdeiros;

                // Agrupar por base de cálculo
                herdeirosFiltrados.forEach(h => {
                    let valorBaseContratualHerdeiro = h.valorTotal;
                    
                    // Ajustar pela proporção contratual se necessário
                    if (resultados.totaisPorTipo?.contratual > 0) {
                        const proporcaoContratual = resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total;
                        valorBaseContratualHerdeiro = h.valorTotal * proporcaoContratual;
                    }
                    
                    const baseKey = valorBaseContratualHerdeiro.toFixed(2);
                    if (!baseGroups.has(baseKey)) {
                        baseGroups.set(baseKey, []);
                    }
                    baseGroups.get(baseKey).push({
                        ...h,
                        valorTotal: valorBaseContratualHerdeiro
                    });
                });
            } else {
                // Sem herdeiros - beneficiário principal
                let valorBaseContratual = resultados.valorBase;

                if (resultados.totaisPorTipo?.contratual > 0) {
                    const proporcaoContratual = resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total;
                    valorBaseContratual = resultados.valorBase * proporcaoContratual;
                }

                baseGroups.set('PRINCIPAL', [{
                    nome: 'Beneficiário Principal',
                    valorTotal: valorBaseContratual
                }]);
            }

            return baseGroups;
        }

        // CESSOES SINDICATOS E ADVOGADOS

        function gerarSecaoCessoesSindicatos(resultados, dados) {
            if (!resultados.sindicatos) return '';
            
            const isPreferencia = dados.tipoCalculo === 'preferencia';
            
            if (isPreferencia) return '';
            
            const sindicatosComCessao = resultados.sindicatos.filter(sind => 
                sind.cessoesSind && sind.cessoesSind.length > 0
            );
            
            if (sindicatosComCessao.length === 0) return '';

            const secoesSindicatos = sindicatosComCessao.map(sind => {
                const pluralCessionarios = sind.cessoesSind.length > 1 ? 's' : '';
                
                const linhasCessionarios = (sind.cessionarios || []).map(cessionario => `
                    <tr>
                        <td>${cessionario.nome} (cessionário)</td>
                        <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(cessionario.valorBruto)}</td>
                    </tr>
                `).join('');
                
                return `
                    <div style="margin-bottom: 20px;">
                        <h4>🔄 Cessão de Sindicato: ${sind.nome}</h4>
                        <p><strong>Valor do Direito do Sindicato:</strong> R$ ${formatarMoeda(sind.valorBruto)}</p>
                        <p><strong>Cedido:</strong> ${(sind.percentualCessionarioSind * 100).toFixed(2)}% para ${sind.cessoesSind.length} cessionário${pluralCessionarios}</p>
                        
                        <table>
                            <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                            <tr style="background-color: #f8f9fa;">
                                <td><strong>${sind.nome} (fica com)</strong></td>
                                <td>${(sind.percentualSindicato * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(sind.valorBrutoSindicato)}</td>
                            </tr>
                            ${linhasCessionarios}
                            <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                                <td>TOTAL</td>
                                <td>100.00%</td>
                                <td>R$ ${formatarMoeda(sind.valorBruto)}</td>
                            </tr>
                        </table>
                    </div>
                `;
            }).join('');

            return `
                <div class="table-container">
                    <h3>🔄 Cessões de Sindicatos</h3>
                    ${secoesSindicatos}
                </div>
            `;
        }

        function gerarSecaoCessoesAdvogados(resultados, dados) {
            if (!resultados.honorarios || resultados.honorarios.length === 0) return '';

            const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;

            if (temHerdeiros) {
                return gerarCessoesAdvogadosComHerdeiros(resultados, dados);
            } else {
                return gerarCessoesAdvogadosSemHerdeiros(resultados, dados);
            }
        }

        // ========== FUNÇÕES AUXILIARES DE CESSOES ADVOGADOS ==========

        function gerarCessoesAdvogadosComHerdeiros(resultados, dados) {
            const isPreferencia = dados.tipoCalculo === 'preferencia';
            const isParcial = dados.tipoCalculo === 'parcial';

            if (!isPreferencia) {
                // ORDEM OU PARCIAL
                return gerarCessoesAdvogadosOrdem(resultados, dados, isParcial);
            } else {
                // PREFERÊNCIA
                return gerarCessoesAdvogadosPreferencia(resultados, dados);
            }
        }

        function gerarCessoesAdvogadosOrdem(resultados, dados, isParcial) {
            const advogadosComCessao = resultados.honorarios.filter(adv => 
                adv.cessoesAdv && adv.cessoesAdv.length > 0
            );
            
            if (advogadosComCessao.length === 0) return '';
            
            const secoesCessoes = advogadosComCessao.map(adv => {
                // Calcular valores conforme tipo
                const { valorHonorario, valorAdvogado } = isParcial
                    ? { 
                        valorHonorario: resultados.valorBase * adv.percentual,
                        valorAdvogado: resultados.valorBase * adv.percentualAdvogado 
                    }
                    : { 
                        valorHonorario: adv.valorBruto,
                        valorAdvogado: adv.valorBrutoAdvogado 
                    };
                const proporcaoContratual = resultados.totaisPorTipo?.contratual 
                ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total 
                : 1;
                const valorBasePrecatorio = isParcial 
                    ? resultados.valorBase 
                    : resultados.valortotatt;
                const valorBaseContratual = valorBasePrecatorio * proporcaoContratual;

                // Linhas dos cessionários
                const linhasCessionarios = (adv.cessionarios || []).map(cessionario => {
                    const valorCessionario = valorBaseContratual * cessionario.percentual;
                    
                    return `
                        <tr>
                            <td>${cessionario.nome} (cessionário)</td>
                            <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                            <td>R$ ${formatarMoeda(valorCessionario)}</td>
                        </tr>
                    `;
                }).join('');

                const valorTotalSobrePrecatorio = valorBaseContratual * adv.percentual;

                const pluralCessionarios = adv.cessoesAdv.length > 1 ? 's' : '';
                const textoTipo = isParcial ? ' (Parcial)' : '';

                return `
                    <div style="margin-bottom: 20px;">
                        <h4>🔄 Cessão de Honorários: ${adv.nome}</h4>
                        <p><strong>Valor do Honorário${textoTipo}:</strong> R$ ${formatarMoeda(valorHonorario)}</p>
                        <p><strong>Cedido:</strong> ${(adv.percentualCessionarioAdv * 100).toFixed(2)}% para ${adv.cessoesAdv.length} cessionário${pluralCessionarios}</p>
                        
                        <table>
                            <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                            <tr style="background-color: #f8f9fa;">
                                <td><strong>${adv.nome} (fica com)</strong></td>
                                <td>${(adv.percentualAdvogado * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(valorAdvogado)}</td>
                            </tr>
                            ${linhasCessionarios}
                            <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                                <td>TOTAL</td>
                                <td>${(adv.percentual * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(valorTotalSobrePrecatorio)}</td>
                            </tr>
                        </table>
                    </div>
                `;
            }).join('');
            
            const titulo = isParcial 
                ? '🔄 Cessões de Honorários - Pagamento Parcial' 
                : '🔄 Cessões de Honorários';
            
            return `
                <div class="table-container">
                    <h3>${titulo}</h3>
                    ${secoesCessoes}
                </div>
            `;
        }

        function gerarCessoesAdvogadosPreferencia(resultados, dados) {
            const isPreferenciaParcial = resultados.valorBase < resultados.valortotatt;
            
            const herdeirosFiltrados = resultados.herdeiros.filter(h => 
                h.temPreferencia || h.isPreferenciaParcial
            );
            
            // Agrupar herdeiros por valor base
            const baseGroups = new Map();
            herdeirosFiltrados.forEach(h => {
                const baseKey = h.valorTotal.toFixed(2);
                if (!baseGroups.has(baseKey)) {
                    baseGroups.set(baseKey, []);
                }
                baseGroups.get(baseKey).push(h);
            });
            
            const secoesPorBase = [];
            
            baseGroups.forEach((herdeiros, base) => {
                const valorBase = parseFloat(base);
                const herdeirosNomes = herdeiros.map(h => h.nome).join(', ');
                const grupoEPreferenciaParcial = herdeiros.some(h => h.isPreferenciaParcial);
                
                const advogadosComCessao = resultados.honorarios.filter(adv => 
                    adv.cessoesAdv && adv.cessoesAdv.length > 0
                );
                
                if (advogadosComCessao.length === 0) return;
                
                const proporcaoContratual = resultados.totaisPorTipo?.contratual 
                    ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total 
                    : 1;
                const valorBaseContratual = valorBase * proporcaoContratual;
                
                const secoesCessoes = advogadosComCessao.map(adv => {
                    const valorHonorarioAdvogado = valorBaseContratual * adv.percentual;
                    const valorAdvogadoAposCessao = valorBaseContratual * adv.percentualAdvogado;
                    
                    const linhasCessionarios = grupoEPreferenciaParcial
                        ? gerarLinhasCessionariosAguardando(adv.cessionarios, valorBaseContratual)
                        : gerarLinhasCessionariosRecebendo(adv.cessionarios, valorBaseContratual);
                    
                    const pluralCessionarios = adv.cessoesAdv.length > 1 ? 's' : '';
                    
                    return `
                        <div style="margin-bottom: 20px;">
                            <h4>🔄 Cessão de Honorários: ${adv.nome}</h4>
                            <p><strong>Valor do Honorário (Preferência):</strong> R$ ${formatarMoeda(valorHonorarioAdvogado)}</p>
                            <p><strong>Cedido:</strong> ${(adv.percentualCessionarioAdv * 100).toFixed(2)}% para ${adv.cessoesAdv.length} cessionário${pluralCessionarios}</p>
                            
                            <table>
                                <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                                <tr style="background-color: #f8f9fa;">
                                    <td><strong>${adv.nome} (recebe)</strong></td>
                                    <td>${(adv.percentualAdvogado * 100).toFixed(2)}%</td>
                                    <td>R$ ${formatarMoeda(valorAdvogadoAposCessao)}</td>
                                </tr>
                                ${linhasCessionarios}
                                <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                                    <td>TOTAL</td>
                                    <td>${(adv.percentual * 100).toFixed(2)}%</td>
                                    <td>R$ ${formatarMoeda(valorHonorarioAdvogado)}</td>
                                </tr>
                            </table>
                        </div>
                    `;
                }).join('');
                
                const statusPreferencia = grupoEPreferenciaParcial ? ' (Preferência Parcial)' : ' (Preferência Total)';
                
                secoesPorBase.push(`
                    <div style="margin-bottom: 30px;">
                        <h4>Herdeiros: ${herdeirosNomes}${statusPreferencia}</h4>
                        <p><strong>Valor Base:</strong> R$ ${formatarMoeda(valorBase)}</p>
                        ${secoesCessoes}
                    </div>
                `);
            });
            
            if (secoesPorBase.length === 0) return '';
            
            const titulo = isPreferenciaParcial 
                ? '🔄 Cessões de Honorários - Preferência (Parcial/Total)'
                : '🔄 Cessões de Honorários - Preferência Total';
            
            const explicacao = `• <strong>Preferência por grupo:</strong> Cada grupo tem tratamento específico<br>
                • <strong>Parcial:</strong> Só advogados recebem, cessionários aguardam<br>
                • <strong>Total:</strong> Advogados e cessionários recebem integralmente<br>
                • <strong>Valores calculados</strong> conforme situação de cada grupo`;
            
            return `
                <div class="table-container">
                    <h3>${titulo}</h3>
                    ${secoesPorBase.join('')}
                    <div style="margin-top: 10px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 0.9em;">
                        <strong>💡 Explicação da Preferência:</strong><br>
                        ${explicacao}
                    </div>
                </div>
            `;
        }

        function gerarCessoesAdvogadosSemHerdeiros(resultados, dados) {
            const advogadosComCessao = resultados.honorarios.filter(adv => 
                adv.cessoesAdv && adv.cessoesAdv.length > 0
            );
            
            if (advogadosComCessao.length === 0) return '';
            
            const isPreferencia = dados.tipoCalculo === 'preferencia';
            const isParcial = dados.tipoCalculo === 'parcial';
            const isPreferenciaParcial = isPreferencia && resultados.valorBase < resultados.valortotatt;
            
            const proporcaoContratual = resultados.totaisPorTipo?.contratual 
                ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total 
                : 1;
            
            const secoesCessoes = advogadosComCessao.map(adv => {
                let valorBasePrecatorio, valorBaseContratual;
                if (isParcial) {
                    valorBasePrecatorio = resultados.valorBase;
                    valorBaseContratual = valorBasePrecatorio * proporcaoContratual;
                } else if (isPreferencia) {
                    valorBasePrecatorio = resultados.valorBase;
                    valorBaseContratual = valorBasePrecatorio * proporcaoContratual;
                } else {
                    // Ordem: usa valortotatt (total do precatório)
                    valorBasePrecatorio = resultados.valortotatt;
                    valorBaseContratual = valorBasePrecatorio * proporcaoContratual;
                }
                
                let valorHonorario, valorAdvogado;
                
                if (isPreferenciaParcial) {
                    // Preferência parcial: usa valores já calculados (adv.valorBruto)
                    valorHonorario = adv.valorBruto;
                    valorAdvogado = adv.valorBrutoAdvogado;
                } else {
                    // Todos os outros casos: calcula sobre valorBaseContratual
                    valorHonorario = valorBaseContratual * adv.percentual;
                    valorAdvogado = valorBaseContratual * adv.percentualAdvogado;
                }
                
                let linhasCessionarios = '';
                if (isPreferenciaParcial) {
                    linhasCessionarios = gerarLinhasCessionariosAguardando(adv.cessionarios, valorBaseContratual);
                } else if (isParcial) {
                    linhasCessionarios = (adv.cessionarios || []).map(cessionario => {
                        const valorCessionario = valorBaseContratual * cessionario.percentual;
                        return `
                            <tr>
                                <td>${cessionario.nome} (cessionário)</td>
                                <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(valorCessionario)}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    linhasCessionarios = gerarLinhasCessionariosRecebendo(adv.cessionarios, valorBaseContratual);
                }
                
                const pluralCessionarios = adv.cessoesAdv.length > 1 ? 's' : '';
                let textoTipo = '';
                if (isPreferenciaParcial) textoTipo = ' (Preferência)';
                else if (isParcial) textoTipo = ' (Parcial)';
                
                return `
                    <div style="margin-bottom: 20px;">
                        <h4>🔄 Cessão de Honorários: ${adv.nome}</h4>
                        <p><strong>Valor do Honorário${textoTipo}:</strong> R$ ${formatarMoeda(valorHonorario)}</p>
                        <p><strong>Cedido:</strong> ${(adv.percentualCessionarioAdv * 100).toFixed(2)}% para ${adv.cessoesAdv.length} cessionário${pluralCessionarios}</p>
                        
                        <table>
                            <tr><th>Recebedor</th><th>Percentual</th><th>Valor Bruto</th></tr>
                            <tr style="background-color: #f8f9fa;">
                                <td><strong>${adv.nome} (fica com)</strong></td>
                                <td>${(adv.percentualAdvogado * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(valorAdvogado)}</td>
                            </tr>
                            ${linhasCessionarios}
                            <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                                <td>TOTAL</td>
                                <td>${(adv.percentual * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(valorHonorario)}</td>
                            </tr>
                        </table>
                    </div>
                `;
            }).join('');
            
            let titulo = '🔄 Cessões de Honorários';
            if (isPreferenciaParcial) titulo += ' - Preferência (Parcial)';
            else if (isParcial) titulo += ' - Pagamento Parcial';
            
            return `
                <div class="table-container">
                    <h3>${titulo}</h3>
                    ${secoesCessoes}
                </div>
            `;
        }

        function gerarLinhasCessionariosAguardando(cessionarios, valorBaseContratual) {
            return (cessionarios || []).map(cessionario => {
                const valorCessionario = valorBaseContratual * cessionario.percentual;
                return `
                    <tr>
                        <td>${cessionario.nome} (cessionário) - <em>aguarda</em></td>
                        <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorCessionario)}</td>
                    </tr>
                `;
            }).join('');
        }

        function gerarLinhasCessionariosRecebendo(cessionarios, valorBaseContratual) {
            return (cessionarios || []).map(cessionario => {
                const valorCessionario = valorBaseContratual * cessionario.percentual;
                
                return `
                    <tr>
                        <td>${cessionario.nome} (cessionário)</td>
                        <td>${(cessionario.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorCessionario)}</td>
                    </tr>
                `;
            }).join('');
        }

        // Cessoes Beneficiario Principal

        function gerarSecaoCessoesBeneficiario(resultados, dados) {
            if (!resultados.cessoesBeneficiarioCalculadas || resultados.cessoesBeneficiarioCalculadas.length === 0) return '';

            const contexto = extrairContextoBeneficiario(resultados, dados);
            const valoresBeneficiario = calcularValoresBeneficiario(resultados, dados, contexto);
            const valoresCessionarios = calcularValoresCessionarios(resultados, dados, contexto);
            
            const linhasCessionarios = gerarLinhasCessionariosBeneficiario(valoresCessionarios, contexto);
            const totais = calcularTotaisBeneficiario(valoresBeneficiario, valoresCessionarios, contexto);
            const alertBox = gerarAlertBoxBeneficiario(resultados, dados, contexto, valoresBeneficiario, totais);

            return `
                <div class="cessoes-beneficiario">
                    <div class="table-container">
                        <h3>🔄 Cessões do Beneficiário Principal</h3>
                        <div style="margin-bottom: 20px;">
                            ${gerarCabecalhoBeneficiario(dados, resultados, contexto)}
                            ${gerarTabelaCessoesBeneficiario(dados, resultados, contexto, valoresBeneficiario, linhasCessionarios, totais)}
                            ${gerarNotasExplicativas(contexto, dados, resultados)}
                        </div>
                        ${alertBox}
                    </div>
                </div>
            `;
        }

        // ========== FUNÇÕES AUXILIARES CESSOES BEN==========

        function extrairContextoBeneficiario(resultados, dados) {
            const dividaTotalAtualizada = resultados.valortotatt || 0;
            const valorPago = resultados.valorBase || 0;
            
            const percentualTotalAdv = (dados.advogados || []).reduce((sum, adv) => sum + (adv.percentual || 0), 0);
            const percentualTotalSind = (dados.sindicatos || []).reduce((sum, sind) => sum + (sind.percentual || 0), 0);
            const percentualDeducoes = percentualTotalAdv + percentualTotalSind;
            
            const dividaSemHonorarios = dividaTotalAtualizada * (1 - percentualDeducoes);
            const temHerdeiros = resultados.temHerdeiros && Array.isArray(resultados.herdeiros) && resultados.herdeiros.length > 0;
            const percentualPagoSobreDivida = dividaTotalAtualizada > 0 ? Math.min(1, valorPago / dividaTotalAtualizada) : 0;

            const totalCedido = resultados.cessoesBeneficiarioCalculadas.reduce((total, cessao) =>
                total + (cessao.percentual || 0), 0
            );

            const listaCessionarios = resultados.cessoesBeneficiarioCalculadas
                .map(cessao => `${cessao.cessionario} (${((cessao.percentual || 0) * 100).toFixed(2)}%)`)
                .join(', ');

            return {
                dividaTotalAtualizada,
                valorPago,
                percentualTotalAdv,
                percentualTotalSind,
                percentualDeducoes,
                dividaSemHonorarios,
                isParcial: dados.tipoCalculo === 'parcial',
                isPreferenciasParcial: !!resultados.isPreferenciasParcial,
                temHerdeiros,
                percentualPagoSobreDivida,
                totalCedido,
                listaCessionarios
            };
        }

        function calcularValoresBeneficiario(resultados, dados, contexto) {
            const { dividaTotalAtualizada, percentualDeducoes, temHerdeiros, isParcial, percentualPagoSobreDivida } = contexto;
            
            const valorBrutoBeneficiario = dividaTotalAtualizada * (resultados.percentualBeneficiarioFinal || 0);
            const deducoesBeneficiario = valorBrutoBeneficiario * percentualDeducoes;
            const parteBeneficiario = valorBrutoBeneficiario - deducoesBeneficiario;

            let beneficiarioRecebe = 0;
            let beneficiarioAguarda = 0;

            if (temHerdeiros && dados.tipoCalculo === 'preferencia') {
                beneficiarioRecebe = 0;
                beneficiarioAguarda = parteBeneficiario;
            } else if (temHerdeiros) {
                beneficiarioRecebe = 0;
                beneficiarioAguarda = parteBeneficiario;
            } else if (isParcial) {
                beneficiarioRecebe = parteBeneficiario * percentualPagoSobreDivida;
                beneficiarioAguarda = Math.max(0, parteBeneficiario - beneficiarioRecebe);
            } else {
                beneficiarioRecebe = (resultados.valorBeneficiarioAposCessoes != null) 
                    ? resultados.valorBeneficiarioAposCessoes 
                    : parteBeneficiario;
                beneficiarioAguarda = Math.max(0, parteBeneficiario - beneficiarioRecebe);
            }

            return {
                valorBrutoBeneficiario,
                deducoesBeneficiario,
                parteBeneficiario,
                beneficiarioRecebe,
                beneficiarioAguarda
            };
        }

        function calcularValoresCessionarios(resultados, dados, contexto) {
            const { dividaTotalAtualizada, percentualDeducoes, isPreferenciasParcial, isParcial, percentualPagoSobreDivida } = contexto;

            return resultados.cessoesBeneficiarioCalculadas.map(cessao => {
                const valorBrutoCessionario = dividaTotalAtualizada * (cessao.percentual || 0);
                const deducoesCessionario = valorBrutoCessionario * percentualDeducoes;
                const parteCessionario = valorBrutoCessionario - deducoesCessionario;

                let cessionarioRecebe = 0;
                let cessionarioAguarda = 0;

                if (isPreferenciasParcial) {
                    cessionarioRecebe = 0;
                    cessionarioAguarda = parteCessionario;
                } else if (isParcial) {
                    cessionarioRecebe = parteCessionario * percentualPagoSobreDivida;
                    cessionarioAguarda = Math.max(0, parteCessionario - cessionarioRecebe);
                } else {
                    cessionarioRecebe = (cessao.valorBruto != null) ? cessao.valorBruto : parteCessionario;
                    cessionarioAguarda = 0;
                }

                return {
                    cessao,
                    valorBrutoCessionario,
                    deducoesCessionario,
                    parteCessionario,
                    cessionarioRecebe,
                    cessionarioAguarda
                };
            });
        }

        function gerarLinhasCessionariosBeneficiario(valoresCessionarios, contexto){
            return valoresCessionarios.map(({ cessao, valorBrutoCessionario, deducoesCessionario, parteCessionario, cessionarioRecebe, cessionarioAguarda }) => `
                <tr>
                    <td>${cessao.cessionario}</td>
                    <td>${((cessao.percentual || 0) * 100).toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(valorBrutoCessionario)}</td>
                    <td>${(contexto.percentualDeducoes * 100).toFixed(2)}%</td>
                    <td>R$ ${formatarMoeda(deducoesCessionario)}</td>
                    <td>R$ ${formatarMoeda(parteCessionario)}</td>
                    <td>R$ ${formatarMoeda(cessionarioRecebe)}</td>
                    <td>R$ ${formatarMoeda(cessionarioAguarda)}</td>
                </tr>
            `).join('');
        }

        function calcularTotaisBeneficiario(valoresBeneficiario, valoresCessionarios, contexto) {
            const somaRecebeCessionarios = valoresCessionarios.reduce((total, v) => total + v.cessionarioRecebe, 0);
            const somaAguardaCessionarios = valoresCessionarios.reduce((total, v) => total + v.cessionarioAguarda, 0);

            return {
                totalValorBruto: contexto.dividaTotalAtualizada,
                totalDeducoes: contexto.dividaTotalAtualizada * contexto.percentualDeducoes,
                totalLiquido: contexto.dividaSemHonorarios,
                totalRecebe: valoresBeneficiario.beneficiarioRecebe + somaRecebeCessionarios,
                totalAguarda: valoresBeneficiario.beneficiarioAguarda + somaAguardaCessionarios
            };
        }

        function gerarCabecalhoBeneficiario(dados, resultados, contexto) {
            const { dividaTotalAtualizada, totalCedido, listaCessionarios, temHerdeiros } = contexto;
            
            return `
                <h4>Cessão do Beneficiário: ${dados.beneficiario}</h4>
                <p><strong>Tipo de Cálculo:</strong> ${dados.tipoCalculo} ${dados.tipoCalculo === 'preferencia' ? '(preferencial)' : '(ordem comum)'}</p>
                <p><strong>Dívida Total:</strong> R$ ${formatarMoeda(dividaTotalAtualizada)}</p>
                <p><strong>Total Cedido:</strong> ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</p>
                ${temHerdeiros ? `
                <div style="background-color: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <p style="color: #004085; margin: 0;">
                        <strong>ℹ️ Nota:</strong> O beneficiário faleceu, deixando ${resultados.herdeiros.length} herdeiro(s). 
                        Os valores remanescentes do beneficiário serão distribuídos entre os herdeiros.
                    </p>
                </div>
                ` : ''}
            `;
        }

        function gerarTabelaCessoesBeneficiario(dados, resultados, contexto, valoresBeneficiario, linhasCessionarios, totais) {
            const { percentualDeducoes, temHerdeiros } = contexto;
            const { valorBrutoBeneficiario, deducoesBeneficiario, parteBeneficiario, beneficiarioRecebe, beneficiarioAguarda } = valoresBeneficiario;

            return `
                <table>
                    <tr>
                        <th rowspan="2">Beneficiário</th>
                        <th rowspan="2">%</th>
                        <th rowspan="2">Valor Bruto</th>
                        <th colspan="2" style="text-align: center; background-color: #f8f9fa;">Deduções Acessórias</th>
                        <th rowspan="2">Valor Líquido*</th>
                        <th rowspan="2">Recebe Agora*</th>
                        <th rowspan="2">Aguarda Ordem</th>
                    </tr>
                    <tr>
                        <th style="background-color: #f8f9fa;">% Total</th>
                        <th style="background-color: #f8f9fa;">Valor</th>
                    </tr>
                    ${resultados.percentualBeneficiarioFinal > 0 ? `
                    <tr>
                        <td>${dados.beneficiario}${temHerdeiros ? ' †' : ''}</td>
                        <td>${(resultados.percentualBeneficiarioFinal * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorBrutoBeneficiario)}</td>
                        <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(deducoesBeneficiario)}</td>
                        <td>R$ ${formatarMoeda(parteBeneficiario)}</td>
                        <td>R$ ${formatarMoeda(beneficiarioRecebe)}</td>
                        <td>R$ ${formatarMoeda(beneficiarioAguarda)}</td>
                    </tr>
                    ` : `
                    <tr style="background-color: #f8f9fa;">
                        <td><em>${dados.beneficiario} (cedeu tudo)</em></td>
                        <td>0.00%</td>
                        <td>R$ 0,00</td>
                        <td>0.00%</td>
                        <td>R$ 0,00</td>
                        <td>R$ 0,00</td>
                        <td>R$ 0,00</td>
                        <td>R$ 0,00</td>
                    </tr>
                    `}
                    ${linhasCessionarios}
                    <tr class="highlight" style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
                        <td>TOTAL</td>
                        <td>100.00%</td>
                        <td>R$ ${formatarMoeda(totais.totalValorBruto)}</td>
                        <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(totais.totalDeducoes)}</td>
                        <td>R$ ${formatarMoeda(totais.totalLiquido)}</td>
                        <td>R$ ${formatarMoeda(totais.totalRecebe)}</td>
                        <td>R$ ${formatarMoeda(totais.totalAguarda)}</td>
                    </tr>
                </table>
            `;
        }

        function gerarNotasExplicativas(contexto, dados, resultados) {
            const { percentualTotalAdv, percentualTotalSind, percentualDeducoes, isParcial, temHerdeiros } = contexto;

            return `
                <div style="padding: 8px; margin: 10px 0; font-size: 0.85em; color: #666;">
                    <p style="margin: 0;">
                        <strong>📝 Deduções Acessórias:</strong> 
                        Honorários (${(percentualTotalAdv * 100).toFixed(2)}%) + 
                        Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%) = 
                        ${(percentualDeducoes * 100).toFixed(2)}%
                    </p>
                    <p style="margin: 5px 0 0 0;">
                        <strong>* Valor Líquido/Recebe Agora:</strong> Valores após a dedução de honorários e sindicatos. 
                        ${isParcial ? 'Valores calculados sobre o pagamento parcial.' : ''}
                        ${temHerdeiros ? 'Para o beneficiário falecido, este valor será distribuído entre os herdeiros.' : ''}
                    </p>
                </div>
            `;
        }

        function gerarAlertBoxBeneficiario(resultados, dados, contexto, valoresBeneficiario, totais) {
            const { temHerdeiros, isParcial, isPreferenciasParcial } = contexto;
            const { beneficiarioRecebe } = valoresBeneficiario;

            if (isPreferenciasParcial) {
                return `
                    <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                        <strong>ℹ️ Preferência Parcial:</strong><br>
                        • <strong>Teto da preferência:</strong> R$ ${formatarMoeda(resultados.valorBase)}<br>
                        • <strong>Pagamento imediato:</strong> R$ ${formatarMoeda(temHerdeiros ? 0 : beneficiarioRecebe)} ${temHerdeiros ? '(beneficiário falecido - valor vai para herdeiros)' : '(só para o beneficiário)'}<br>
                        • <strong>Saldo devedor total:</strong> R$ ${formatarMoeda(totais.totalAguarda)}
                    </div>
                `;
            }

            if (isParcial) {
                return `
                    <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                        <strong>⚠️ Pagamento Parcial:</strong><br>
                        • <strong>Dívida total:</strong> R$ ${formatarMoeda(contexto.dividaTotalAtualizada)}<br>
                        • <strong>Valor do pagamento:</strong> R$ ${formatarMoeda(resultados.valorBase)}<br>
                    </div>
                `;
            }

            if (temHerdeiros) {
                return `
                    <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                        <strong>⚠️ Beneficiário Falecido:</strong><br>
                        • Os valores do beneficiário serão distribuídos entre os ${resultados.herdeiros.length} herdeiro(s)<br>
                        • ${dados.tipoCalculo === 'preferencia' ? 'Herdeiros com preferência receberão conforme o teto estabelecido' : 'Distribuição seguirá ordem cronológica'}
                    </div>
                `;
            }

            return `
                <div class="success-box" style="margin-top: 10px; padding: 12px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
                    <strong>✅ Pagamento Integral:</strong> Todos os beneficiários recebem integralmente.
                </div>
            `;
        }

        // Herdeiros

        function gerarSecaoHerdeiros(resultados, dados) {
            if (!resultados.temHerdeiros || resultados.herdeiros.length === 0) return '';
            
            // Contexto geral
            const proporcaoContratual = (resultados.totaisPorTipo?.contratual > 0)
                ? resultados.totaisPorTipo.contratual / resultados.totaisPorTipo.total
                : 1;
            
            const rraTotal = resultados.rraTotal || 0;
            const valortotatt = resultados.valortotatt || 0;
            
            // Gerar linhas dos herdeiros
            const linhasHerdeiros = resultados.herdeiros.map(h => {
                const valorBruto = h.valorAposCessoesBeneficiario || h.valorTotalOriginal;
                
                // Honorários sobre o valor real
                const valorBaseContratual = valorBruto * proporcaoContratual;
                const honorarioTotal = (dados.advogados || []).reduce((sum, adv) => 
                    sum + (valorBaseContratual * adv.percentual), 0
                );
                
                // Sindicatos sobre o valor real
                const sindicatoTotal = (dados.sindicatos || []).reduce((sum, sind) => 
                    sum + (valorBruto * sind.percentual), 0
                );
                
                const valorLiquido = valorBruto - honorarioTotal - sindicatoTotal;
                
                // RRA proporcional
                const rra = (rraTotal !== 0 && valortotatt > 0) 
                    ? Math.round((valorBruto * rraTotal) / valortotatt) 
                    : 0;
                
                return `
                    <tr>
                        <td>${h.nome}</td>
                        <td>${(h.percentual * 100).toFixed(2)}%</td>
                        <td>R$ ${formatarMoeda(valorBruto)}</td>
                        <td>R$ ${formatarMoeda(honorarioTotal)}</td>
                        <td>R$ ${formatarMoeda(sindicatoTotal)}</td>
                        <td>R$ ${formatarMoeda(valorLiquido)}</td>
                        <td>${rra || 0}</td>
                    </tr>
                `;
            }).join('');
            
            // Calcular totais
            const totalRealHerdeiros = resultados.herdeiros.reduce((sum, h) => 
                sum + (h.valorAposCessoesBeneficiario || h.valorTotalOriginal), 0
            );
            
            const valorBaseContratualTotal = totalRealHerdeiros * proporcaoContratual;
            const totalHonorarios = (dados.advogados || []).reduce((sum, adv) => 
                sum + (valorBaseContratualTotal * adv.percentual), 0
            );
            
            const totalSindicatos = (dados.sindicatos || []).reduce((sum, sind) => 
                sum + (totalRealHerdeiros * sind.percentual), 0
            );
            
            const totalLiquido = totalRealHerdeiros - totalHonorarios - totalSindicatos;
            
            const totalRRA = (rraTotal !== 0 && valortotatt > 0)
                ? Math.round((totalRealHerdeiros * rraTotal) / valortotatt)
                : 0;
            
            // Info sobre cessão do beneficiário
            const houveCessao = resultados.percentualBeneficiarioFinal && resultados.percentualBeneficiarioFinal < 1;
            const infoCessao = houveCessao ? `
                <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="color: #856404; margin: 0;">
                        <strong>⚠️ Atenção - Cessão do Beneficiário Principal:</strong><br>
                        O beneficiário cedeu ${((1 - resultados.percentualBeneficiarioFinal) * 100).toFixed(2)}% do precatório antes do falecimento.<br>
                        <strong>Valor total do precatório:</strong> R$ ${formatarMoeda(valortotatt)}<br>
                        <strong>Valor cedido pelo beneficiário:</strong> R$ ${formatarMoeda(valortotatt - totalRealHerdeiros)}<br>
                        <strong>Valor disponível para herdeiros:</strong> R$ ${formatarMoeda(totalRealHerdeiros)}
                    </p>
                </div>
            ` : '';
            
            return `
                <div class="cessoes-beneficiario">
                    <div class="table-container">
                        <h3>👨‍👩‍👧‍👦 Distribuição entre Herdeiros</h3>
                        ${infoCessao}
                        <table>
                            <tr>
                                <th>Nome Herdeiro</th>
                                <th>%</th>
                                <th>Valor Bruto</th>
                                <th>Hon. Contratuais</th>
                                <th>Sindicatos</th>
                                <th>Valor Líquido*</th>
                                <th>RRA</th>
                            </tr>
                            ${linhasHerdeiros}
                            <tr class="highlight" style="background-color: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
                                <td><strong>TOTAIS</strong></td>
                                <td><strong>100%</strong></td>
                                <td><strong>R$ ${formatarMoeda(totalRealHerdeiros)}</strong></td>
                                <td><strong>R$ ${formatarMoeda(totalHonorarios)}</strong></td>
                                <td><strong>R$ ${formatarMoeda(totalSindicatos)}</strong></td>
                                <td><strong>R$ ${formatarMoeda(totalLiquido)}</strong></td>
                                <td><strong>${totalRRA || '-'}</strong></td>
                            </tr>
                        </table>
                        <div class="success-box" style="margin-top: 15px; padding: 10px; border-radius: 4px;">
                            <p style="margin: 0;">* Valor líquido sem considerar Previdência e IR</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // Cessoes herdeiros

        function gerarSecaoCessoesHerdeiros(resultados, dados) {
            const temHerdeiros = resultados.temHerdeiros && resultados.herdeiros.length > 0;
            if (!temHerdeiros) return '';
            
            const herdeirosComCessoes = resultados.herdeiros.filter(h => 
                h.cessoesHerdeiro && h.cessoesHerdeiro.length > 0
            );
            
            if (herdeirosComCessoes.length === 0) return '';
            
            const isPreferencia = dados.tipoCalculo === 'preferencia';
            const percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
            const percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
            const percentualDeducoes = percentualTotalAdv + percentualTotalSind;
            
            // Gera seção para cada herdeiro com cessões
            const secoesHerdeiros = herdeirosComCessoes.map(herdeiro => {
                const valorOriginal = herdeiro.valorTotalOriginal;
                const totalCedido = herdeiro.cessoesHerdeiro.reduce((sum, c) => sum + c.percentual, 0);
                
                // Valores do herdeiro após cessões
                const valorBrutoHerdeiro = valorOriginal * (1 - totalCedido);
                const deducoesHerdeiro = valorBrutoHerdeiro * percentualDeducoes;
                const valorLiquidoHerdeiro = valorBrutoHerdeiro - deducoesHerdeiro;
                
                const herdeiroRecebeAgora = isPreferencia && herdeiro.isPreferenciaParcial
                    ? Math.min(valorLiquidoHerdeiro, herdeiro.valorTotal - (herdeiro.valorTotal * percentualDeducoes))
                    : valorLiquidoHerdeiro;
                
                const herdeiroAguarda = isPreferencia && herdeiro.isPreferenciaParcial
                    ? Math.max(0, valorLiquidoHerdeiro - herdeiroRecebeAgora)
                    : 0;
                
                // Função auxiliar para calcular valores de cessionário
                const calcularCessionario = (cessao) => {
                    const valorBruto = valorOriginal * cessao.percentual;
                    const deducoes = valorBruto * percentualDeducoes;
                    const valorLiquido = valorBruto - deducoes;
                    const recebe = isPreferencia && herdeiro.isPreferenciaParcial ? 0 : valorLiquido;
                    const aguarda = isPreferencia && herdeiro.isPreferenciaParcial ? valorLiquido : 0;
                    
                    return { valorBruto, deducoes, valorLiquido, recebe, aguarda };
                };
                
                // Linhas dos cessionários
                const linhasCessionarios = herdeiro.cessoesHerdeiro.map(cessao => {
                    const { valorBruto, deducoes, valorLiquido, recebe, aguarda } = calcularCessionario(cessao);
                    
                    return `
                        <tr>
                            <td>${cessao.cessionario}</td>
                            <td>${(cessao.percentual * 100).toFixed(2)}%</td>
                            <td>R$ ${formatarMoeda(valorBruto)}</td>
                            <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                            <td>R$ ${formatarMoeda(deducoes)}</td>
                            <td>R$ ${formatarMoeda(valorLiquido)}</td>
                            <td>R$ ${formatarMoeda(recebe)}</td>
                            <td>R$ ${formatarMoeda(aguarda)}</td>
                        </tr>
                    `;
                }).join('');
                
                // Totais (sobre valor original)
                const totalDeducoes = valorOriginal * percentualDeducoes;
                const totalLiquido = valorOriginal - totalDeducoes;
                
                const totalRecebe = herdeiroRecebeAgora + herdeiro.cessoesHerdeiro.reduce((sum, c) => 
                    sum + calcularCessionario(c).recebe, 0
                );
                
                const totalAguarda = herdeiroAguarda + herdeiro.cessoesHerdeiro.reduce((sum, c) => 
                    sum + calcularCessionario(c).aguarda, 0
                );
                
                const listaCessionarios = herdeiro.cessoesHerdeiro
                    .map(c => `${c.cessionario} (${(c.percentual * 100).toFixed(2)}%)`)
                    .join(', ');
                
                const alertBox = isPreferencia && herdeiro.isPreferenciaParcial ? `
                    <div class="warning-box" style="margin-top: 10px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                        <strong>ℹ️ Preferência Parcial:</strong><br>
                        • <strong>Cessões calculadas sobre valor original:</strong> R$ ${formatarMoeda(valorOriginal)}<br>
                        • <strong>Teto da preferência limita pagamento do herdeiro</strong><br>
                        • <strong>Cessionários aguardam</strong> ordem cronológica
                    </div>
                ` : `
                    <div class="success-box" style="margin-top: 10px; padding: 12px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
                        <strong>✅ Pagamento Integral:</strong> Herdeiro e cessionários recebem integralmente baseado no valor original.
                    </div>
                `;
                
                return `
                    <div style="margin-bottom: 30px;">
                        <h4>Cessão do Herdeiro: ${herdeiro.nome}</h4>
                        <p><strong>Valor Original do Herdeiro:</strong> R$ ${formatarMoeda(valorOriginal)}</p>
                        <p><strong>Total Cedido:</strong> ${(totalCedido * 100).toFixed(2)}% para: ${listaCessionarios}</p>
                        
                        <table>
                            <tr>
                                <th rowspan="2">Beneficiário</th>
                                <th rowspan="2">%</th>
                                <th rowspan="2">Valor Bruto</th>
                                <th colspan="2" style="text-align: center; background-color: #f8f9fa;">Deduções Acessórias</th>
                                <th rowspan="2">Valor Líquido*</th>
                                <th rowspan="2">Recebe Agora</th>
                                <th rowspan="2">Aguarda Ordem</th>
                            </tr>
                            <tr>
                                <th style="background-color: #f8f9fa;">% Total</th>
                                <th style="background-color: #f8f9fa;">Valor</th>
                            </tr>
                            <tr>
                                <td>${herdeiro.nome}</td>
                                <td>${((1 - totalCedido) * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(valorBrutoHerdeiro)}</td>
                                <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(deducoesHerdeiro)}</td>
                                <td>R$ ${formatarMoeda(valorLiquidoHerdeiro)}</td>
                                <td>R$ ${formatarMoeda(herdeiroRecebeAgora)}</td>
                                <td>R$ ${formatarMoeda(herdeiroAguarda)}</td>
                            </tr>
                            ${linhasCessionarios}
                            <tr class="highlight" style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;">
                                <td>TOTAL</td>
                                <td>100.00%</td>
                                <td>R$ ${formatarMoeda(valorOriginal)}</td>
                                <td>${(percentualDeducoes * 100).toFixed(2)}%</td>
                                <td>R$ ${formatarMoeda(totalDeducoes)}</td>
                                <td>R$ ${formatarMoeda(totalLiquido)}</td>
                                <td>R$ ${formatarMoeda(totalRecebe)}</td>
                                <td>R$ ${formatarMoeda(totalAguarda)}</td>
                            </tr>
                        </table>
                        
                        <div style="padding: 8px; margin: 10px 0; font-size: 0.85em; color: #666;">
                            <p style="margin: 0;">
                                <strong>📝 Deduções Acessórias:</strong> 
                                Honorários (${(percentualTotalAdv * 100).toFixed(2)}%) + 
                                Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%) = 
                                ${(percentualDeducoes * 100).toFixed(2)}%
                            </p>
                            <p style="margin: 5px 0 0 0;">
                                <strong>* Valor Líquido:</strong> Valor após dedução apenas de honorários e sindicatos (IR e Previdência calculados separadamente).
                            </p>
                        </div>
                        
                        ${alertBox}
                    </div>
                `;
            }).join('');
            
            return `
                <div class="cessoes-herdeiros">
                    <div class="table-container">
                        <h3>🔄 Cessões dos Herdeiros</h3>
                        <div style="margin-bottom: 20px;">
                            <p><strong>Tipo de Cálculo:</strong> ${dados.tipoCalculo} ${dados.tipoCalculo === 'preferencia' ? '(preferencial)' : '(ordem comum)'}</p>
                            <p><strong>Herdeiros com Cessões:</strong> ${herdeirosComCessoes.length} de ${resultados.herdeiros.length} herdeiros</p>
                            
                            ${secoesHerdeiros}
                        </div>
                    </div>
                </div>
            `;
        }

        // Pagamentos

        function gerarSecaoPagamentosOcorridos(resultados, dados) {
            if (!resultados.pagamentos || resultados.pagamentos.length === 0) {
                return '';
            }

            const pagamentosPorBeneficiario = agruparPagamentosPorBeneficiario(resultados.pagamentos);
            const cessionarios = obterTodosCessionarios(resultados);
            const htmlLinhas = gerarLinhasPagamentos(pagamentosPorBeneficiario, cessionarios, dados);

            return `
                <div class="deducoes-acessorias">
                    <div class="table-container">
                        <h3>💳 Pagamentos Ocorridos</h3>
                        <div class="explicacao-juridica">
                            <div class="titulo">Entenda os Pagamentos Ocorridos</div>
                            <p><strong>Valores Pagos:</strong> Montantes que já foram pagos aos beneficiários em datas anteriores.</p>
                            <p><strong>Atualização Monetária:</strong> Os valores foram corrigidos desde a data do pagamento até a data de atualização do cálculo.</p>
                            <p><strong>Desconto Necessário:</strong> Estes valores devem ser deduzidos dos montantes devidos atualmente.</p>
                        </div>
                        
                        <table>
                            <tr>
                                <th>Beneficiário</th>
                                <th>Data do Pagamento</th>
                                <th>Valor Original Pago</th>
                                <th>Índices Aplicados</th>
                                <th>Valor Atualizado</th>
                            </tr>
                            ${htmlLinhas}
                        </table>
                    </div>
                </div>
            `;
        }

        // ========== FUNÇÕES AUXILIARES DE PAGAMENTOS==========

        function agruparPagamentosPorBeneficiario(pagamentos) {
            const grupos = {};
            pagamentos.forEach(pag => {
                if (!grupos[pag.beneficiario]) {
                    grupos[pag.beneficiario] = [];
                }
                grupos[pag.beneficiario].push(pag);
            });
            return grupos;
        }

        function obterTodosCessionarios(resultados) {
            const cessionarios = new Set();
            
            // Cessionários do Beneficiário
            resultados.cessoesBeneficiarioFinais?.forEach(c => cessionarios.add(c.cessionario));
            
            // Cessionários de Herdeiros
            resultados.herdeiros?.forEach(h => {
                h.cessoesHerdeiroFinais?.forEach(c => cessionarios.add(c.cessionario));
            });
            
            // Cessionários de Advogados
            resultados.honorarios?.forEach(adv => {
                adv.cessionarios?.forEach(c => cessionarios.add(c.nome));
            });
            
            // Cessionários de Advogados Sucumbenciais
            resultados.honorariosSucumbenciais?.honorarios?.forEach(adv => {
                adv.cessionarios?.forEach(c => cessionarios.add(c.nome));
            });
            
            // Cessionários de Sindicatos
            resultados.sindicatos?.forEach(sind => {
                sind.cessionarios?.forEach(c => cessionarios.add(c.nome));
            });
            
            return cessionarios;
        }

        function gerarLinhasPagamentos(pagamentosPorBeneficiario, cessionarios, dados) {
            let htmlLinhas = '';
            
            Object.keys(pagamentosPorBeneficiario).forEach(beneficiario => {
                // Não mostrar cessionários sem pagamento direto
                if (cessionarios.has(beneficiario) && pagamentosPorBeneficiario[beneficiario].length === 0) {
                    return;
                }
                
                pagamentosPorBeneficiario[beneficiario].forEach(pag => {
                    const dataFormatada = new Date(pag.dataBase + 'T00:00:00').toLocaleDateString('pt-BR');
                    const pagamentoOriginal = dados.pagamentos.find(p => 
                        p.beneficiario === pag.beneficiario && p.dataBase === pag.dataBase
                    );
                    
                    const { valorTotal, detalhamentoGrid } = calcularValorOriginalComDetalhes(pag, pagamentoOriginal);
                    const indicesTexto = formatarIndices(pag.indices);
                    
                    htmlLinhas += `
                        <tr>
                            <td>${beneficiario}</td>
                            <td>${dataFormatada}</td>
                            <td>
                                <strong style="font-size: 1.05em;">R$ ${formatarMoeda(valorTotal)}</strong>
                                ${detalhamentoGrid}
                            </td>
                            <td>${indicesTexto}</td>
                            <td><strong>R$ ${formatarMoeda(pag.valorAtualizado.total)}</strong></td>
                        </tr>
                    `;
                });
            });
            
            return htmlLinhas;
        }

        function calcularValorOriginalComDetalhes(pag, pagamentoOriginal) {
            let valorTotal = pag.valorOriginal.principal + pag.valorOriginal.juros;
            
            let detalhamentoGrid = `
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; margin-top: 6px; font-size: 0.85em; color: #666;">
                    <span>Principal:</span>
                    <span style="text-align: right;">R$ ${formatarMoeda(pag.valorOriginal.principal)}</span>
                    <span>Juros:</span>
                    <span style="text-align: right;">R$ ${formatarMoeda(pag.valorOriginal.juros)}</span>
            `;
            
            if (pagamentoOriginal) {
                if (pagamentoOriginal.tipoSelic === 'valor' && pagamentoOriginal.valorSelic > 0) {
                    const valorSelic = pagamentoOriginal.valorSelic;
                    valorTotal += valorSelic;
                    detalhamentoGrid += `
                        <span>SELIC:</span>
                        <span style="text-align: right;">R$ ${formatarMoeda(valorSelic)}</span>
                    `;
                } else if (pagamentoOriginal.tipoSelic === 'percentual' && pagamentoOriginal.percentualSelic > 0) {
                    const percentualSelic = pagamentoOriginal.percentualSelic;
                    const valorSelic = (pag.valorOriginal.principal + pag.valorOriginal.juros) * percentualSelic;
                    valorTotal += valorSelic;
                    detalhamentoGrid += `
                        <span>SELIC (${(percentualSelic * 100).toFixed(2)}%):</span>
                        <span style="text-align: right;">R$ ${formatarMoeda(valorSelic)}</span>
                    `;
                }
            }
            
            detalhamentoGrid += `</div>`;
            
            return { valorTotal, detalhamentoGrid };
        }

        function formatarIndices(indices) {
            const detalhes = [];
            
            if (indices.cnj && indices.cnj !== 1) {
                detalhes.push(`CNJ: ${indices.cnj.toFixed(6)}`);
            }
            
            if (indices.selic && indices.selic !== 1) {
                const percentualSelic = ((indices.selic - 1) * 100).toFixed(2);
                detalhes.push(`SELIC: ${percentualSelic}%`);
            }
            
            if (indices.ipcae && indices.ipcae !== 1) {
                detalhes.push(`IPCA - E: ${indices.ipcae.toFixed(6)}`);
            }
            
            if (indices.jurosMora && indices.jurosMora > 0) {
                const percentualMora = (indices.jurosMora * 100).toFixed(4);
                detalhes.push(`J.Mora: ${percentualMora}%`);
            }

            if (indices.ipca && indices.ipca !== 1) {
                detalhes.push(`IPCA: ${indices.ipca.toFixed(6)}`);
            }

            if (indices.juros2AA && indices.juros2AA > 0) {
                const percentualJuros = (indices.juros2AA * 100).toFixed(4);
                detalhes.push(`Juros 2%a.a.: ${percentualJuros}%`);
            }
            
            return detalhes.length > 0 ? detalhes.join(' | ') : 'Sem correção';
        }

        // SALDO REMANCESCENTE

        function gerarDemonstrativoSaldoRemanescente(resultados) {
            if (!resultados.saldosFinais) return '';
            
            const saldos = resultados.saldosFinais;
            
            const linhas = [
                gerarLinhaBeneficiario(saldos.beneficiarioPrincipal),
                gerarLinhasHerdeiros(saldos.herdeiros),
                gerarLinhasSimples(saldos.advogados, 'Advogado'),
                gerarLinhasSimples(saldos.advogadosSucumbenciais, 'Adv. Sucumbencial'),
                gerarLinhasSimples(saldos.sindicatos, 'Sindicato'),
                gerarLinhasCessionarios(saldos.cessionarios)
            ].filter(Boolean).join('');
            
            const totaisComPagamento = calcularTotaisComPagamento(saldos);

            return `
                <div class="pagamentos-finais">
                    <div class="table-container">
                        <h3>📊 Demonstrativo do Saldo Remanescente</h3>
                        <table>
                            <tr>
                                <th>Beneficiário</th>
                                <th>Valor Antes do Pagamento (Bruto)</th>
                                <th>(-) Valor Pago</th>
                                <th>Saldo Remanescente (Bruto)</th>
                            </tr>
                            ${linhas}
                            ${gerarLinhaTotal(totaisComPagamento)}
                        </table>
                        
                        <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                            <strong>⚠️ Observação:</strong> Os valores de IR e Previdência serão calculados sobre o saldo remanescente.
                        </div>
                    </div>
                </div>
            `;
        }

        // ========== FUNÇÕES AUXILIARES DE SALDO REMANESC==========

        function calcularTotaisComPagamento(saldos) {
            let totalValorBruto = 0;
            let totalPagamento = 0;
            let totalSaldo = 0;
            
            // Beneficiário Principal 
            if (saldos.beneficiarioPrincipal && saldos.beneficiarioPrincipal.saldo > 0 && saldos.beneficiarioPrincipal.pagamento > 0) {
                totalValorBruto += saldos.beneficiarioPrincipal.valorBruto || 0;
                totalPagamento += saldos.beneficiarioPrincipal.pagamento || 0;
                totalSaldo += saldos.beneficiarioPrincipal.saldo || 0;
            }
            
            // Herdeiros 
            if (saldos.herdeiros?.length > 0) {
                saldos.herdeiros
                    .filter(herd => herd.pagamento > 0 && (herd.pagamentoDireto > 0 || herd.pagamentoDoBeneficiario > 0))
                    .forEach(herd => {
                        totalValorBruto += herd.valorBruto || 0;
                        totalPagamento += herd.pagamento || 0;
                        totalSaldo += herd.saldo || 0;
                    });
            }
            
            // Advogados 
            if (saldos.advogados?.length > 0) {
                saldos.advogados
                    .filter(adv => adv.pagamento > 0)
                    .forEach(adv => {
                        totalValorBruto += adv.valorBruto || 0;
                        totalPagamento += adv.pagamento || 0;
                        totalSaldo += adv.saldo || 0;
                    });
            }
            
            // Advogados Sucumbenciais 
            if (saldos.advogadosSucumbenciais?.length > 0) {
                saldos.advogadosSucumbenciais
                    .filter(adv => adv.pagamento > 0)
                    .forEach(adv => {
                        totalValorBruto += adv.valorBruto || 0;
                        totalPagamento += adv.pagamento || 0;
                        totalSaldo += adv.saldo || 0;
                    });
            }
            
            // Sindicatos 
            if (saldos.sindicatos?.length > 0) {
                saldos.sindicatos
                    .filter(sind => sind.pagamento > 0)
                    .forEach(sind => {
                        totalValorBruto += sind.valorBruto || 0;
                        totalPagamento += sind.pagamento || 0;
                        totalSaldo += sind.saldo || 0;
                    });
            }
            
            // Cessionários 
            if (saldos.cessionarios?.length > 0) {
                saldos.cessionarios
                    .filter(cess => {
                        if (cess.pagamento <= 0) return false;
                        if (cess.hasOwnProperty('pagamentoDireto')) {
                            const pagamentoDoCedente = cess.pagamento - cess.pagamentoDireto;
                            return cess.pagamentoDireto > 0 || pagamentoDoCedente > 0;
                        }
                        return true;
                    })
                    .forEach(cess => {
                        totalValorBruto += cess.valorBruto || 0;
                        totalPagamento += cess.pagamento || 0;
                        totalSaldo += cess.saldo || 0;
                    });
            }
            
            return {
                totalValorBruto,
                totalPagamento,
                totalSaldo
            };
        }

        function gerarLinhaBeneficiario(benef) {
            if (!benef || benef.pagamento <= 0 || benef.saldo <= 0) return '';
            
            return `
                <tr>
                    <td>${benef.nome} (Beneficiário Principal)</td>
                    <td>R$ ${formatarMoeda(benef.valorBruto)}</td>
                    <td>R$ ${formatarMoeda(benef.pagamento)}</td>
                    <td><strong>R$ ${formatarMoeda(benef.saldo)}</strong></td>
                </tr>
            `;
        }

        function gerarLinhasHerdeiros(herdeiros) {
            if (!herdeiros || herdeiros.length === 0) return '';
            
            return herdeiros
                .filter(herd => {
                    return herd.pagamento > 0 && (
                        herd.pagamentoDireto > 0 || 
                        herd.pagamentoDoBeneficiario > 0
                    );
                })
                .map(herd => {
                    const detalhesPagamento = (herd.pagamentoDoBeneficiario && herd.pagamentoDoBeneficiario > 0)
                        ? `<br><small style="color: #666;">(Direto: R$ ${formatarMoeda(herd.pagamentoDireto || 0)} + Do Benef.: R$ ${formatarMoeda(herd.pagamentoDoBeneficiario)})</small>`
                        : '';
                    
                    return `
                        <tr>
                            <td>${herd.nome} (Herdeiro)</td>
                            <td>R$ ${formatarMoeda(herd.valorBruto)}</td>
                            <td>R$ ${formatarMoeda(herd.pagamento)}${detalhesPagamento}</td>
                            <td><strong>R$ ${formatarMoeda(herd.saldo)}</strong></td>
                        </tr>
                    `;
                }).join('');
        }

        function gerarLinhasSimples(lista, tipo) {
            if (!lista || lista.length === 0) return '';
            
            return lista
                .filter(item => item.pagamento > 0) 
                .map(item => {
                    const rotulo = tipo === 'Advogado' || tipo === 'Adv. Sucumbencial'
                        ? `${item.nome} (${tipo} ${item.tipo})`
                        : `${item.nome} (${tipo})`;
                    
                    return `
                        <tr>
                            <td>${rotulo}</td>
                            <td>R$ ${formatarMoeda(item.valorBruto)}</td>
                            <td>R$ ${formatarMoeda(item.pagamento)}</td>
                            <td><strong>R$ ${formatarMoeda(item.saldo)}</strong></td>
                        </tr>
                    `;
                }).join('');
        }

        function gerarLinhasCessionarios(cessionarios) {
            if (!cessionarios || cessionarios.length === 0) return '';
            
            return cessionarios
                .filter(cess => {
                    if (cess.pagamento <= 0) return false;

                    if (cess.hasOwnProperty('pagamentoDireto')) {
                        const pagamentoDoCedente = cess.pagamento - cess.pagamentoDireto;
                        return cess.pagamentoDireto > 0 || pagamentoDoCedente > 0;
                    }
                    
                    return true;
                })
                .map(cess => {
                    let detalhesPagamento = '';
                    
                    if (cess.hasOwnProperty('pagamentoDireto')) {
                        const pagamentoDoCedente = cess.pagamento - cess.pagamentoDireto;
                        if (pagamentoDoCedente > 0) {
                            detalhesPagamento = `<br><small style="color: #666;">(Direto: R$ ${formatarMoeda(cess.pagamentoDireto)} + Do Cedente: R$ ${formatarMoeda(pagamentoDoCedente)})</small>`;
                        }
                    }
                    
                    return `
                        <tr>
                            <td>${cess.nome} (${cess.tipo})</td>
                            <td>R$ ${formatarMoeda(cess.valorBruto)}</td>
                            <td>R$ ${formatarMoeda(cess.pagamento)}${detalhesPagamento}</td>
                            <td><strong>R$ ${formatarMoeda(cess.saldo)}</strong></td>
                        </tr>
                    `;
                }).join('');
        }

        function gerarLinhaTotal(totais) {
            return `
                <tr class="highlight">
                    <td><strong>TOTAL</strong></td>
                    <td><strong>R$ ${formatarMoeda(totais.totalValorBruto)}</strong></td>
                    <td><strong>R$ ${formatarMoeda(totais.totalPagamento)}</strong></td>
                    <td><strong>R$ ${formatarMoeda(totais.totalSaldo)}</strong></td>
                </tr>
            `;
        }

        //DEDUCOES LEGAIS

        function gerarSecaoDeducoes(resultados, dados) {
            const temPrevidencia = dados.incidenciaPrevidencia || 
                (dados.valoresPrincipais && dados.valoresPrincipais.some(item => item.tributacao?.previdencia === true));
            
            const temIR = (dados.incidenciaIR || 
                (dados.valoresPrincipais && dados.valoresPrincipais.some(item => item.tributacao?.ir === true))) 
                && (dados.tipoBeneficiario === 'pj' || resultados.rrapagamento !== 0);

            if (!temPrevidencia && !temIR) return '';

            if (dados.tipoCalculo === 'acordo') {
                if (!validarAdesaoParaAcordo(dados)) return '';
            }

            const resultadosParaUsar = resultados.saldosFinais 
                ? ajustarResultadosComPagamentos(resultados, dados) 
                : resultados;

            const config = {
                temPrevidencia,
                temIR,
                tipoPrevidencia: dados.valoresPrincipais?.find(item => item.tributacao?.tipoPrevidencia)?.tributacao.tipoPrevidencia || null,
                temHerdeiros: resultadosParaUsar.temHerdeiros && resultadosParaUsar.herdeiros.length > 0  // ← MUDOU
            };

            if (dados.natureza === 'comum') {
                return gerarDeducoesSimples(resultadosParaUsar, dados, config.temPrevidencia, config.temIR);
            }
            
            if (!config.temHerdeiros) {
                return gerarDeducoesSimples(resultadosParaUsar, dados, config.temPrevidencia, config.temIR);
            }
            
            return dados.tipoCalculo === 'preferencia'
                ? gerarDeducoesPreferencia(resultadosParaUsar, dados, config)
                : gerarDeducoesOrdem(resultadosParaUsar, dados, config);
        }

        function validarAdesaoParaAcordo(dados) {
            const adesoes = obterAdesaoAcordo();
            const beneficiarioOuHerdeirosAderiram = adesoes.beneficiario || adesoes.herdeiros.length > 0;
            
            const cessionarioRelevante = adesoes.cessionarios.some(cessaoIndex => {
                const cessao = dados.cessoes?.[cessaoIndex];
                return cessao?.tipo === 'cessaobenPrincipal' || cessao?.tipo === 'cessaoherdeiro';
            });
            
            return beneficiarioOuHerdeirosAderiram || cessionarioRelevante;
        }

        function gerarDeducoesOrdem(resultados, dados, config) {
            const { temPrevidencia, temIR, tipoPrevidencia } = config;
            
            let herdeirosFiltrados = resultados.herdeiros;
            if (dados.tipoCalculo === 'acordo') {
                const adesoes = obterAdesaoAcordo();
                herdeirosFiltrados = resultados.herdeiros.filter((h, index) => 
                    adesoes.herdeiros.includes(index)
                );
            }
            
            const secoes = [];
            
            const secaoBeneficiario = gerarSecaoBeneficiarioPrincipal(resultados, dados, temPrevidencia, temIR, tipoPrevidencia);
            if (secaoBeneficiario) {
                secoes.push(secaoBeneficiario);
            }
            
            const secoesHerdeiros = gerarSecoesHerdeiros(herdeirosFiltrados, dados, temPrevidencia, temIR, tipoPrevidencia, false);
            secoes.push(...secoesHerdeiros);
            
            if (secoes.length === 0) return '';
            
            return montarResultadoFinal(secoes, 'ordem');
        }

        function gerarDeducoesPreferencia(resultados, dados, config) {
            const { temPrevidencia, temIR, tipoPrevidencia } = config;
            
            let herdeirosFiltrados;
            if (dados.tipoCalculo === 'acordo') {
                const adesoes = obterAdesaoAcordo();
                const herdeirosPorAdesao = resultados.herdeiros.filter((h, index) => 
                    adesoes.herdeiros.includes(index)
                );
                herdeirosFiltrados = herdeirosPorAdesao.filter(h => h.temPreferencia || h.isPreferenciaParcial);
            } else {
                herdeirosFiltrados = resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial);
            }
            
            if (herdeirosFiltrados.length === 0) return '';
            
            const secoesPorBase = gerarSecoesHerdeiros(herdeirosFiltrados, dados, temPrevidencia, temIR, tipoPrevidencia, true);
            
            if (secoesPorBase.length === 0) return '';
            
            const isPreferenciaParcial = resultados.valorBase < resultados.valortotatt;
            const tipoTitulo = isPreferenciaParcial ? 'preferencia_parcial' : 'preferencia_total';
            
            return montarResultadoFinal(secoesPorBase, tipoTitulo);
        }

        function gerarSecaoBeneficiarioPrincipal(resultados, dados, temPrevidencia, temIR, tipoPrevidencia) {
            const temCessoesBeneficiario = resultados.cessoesBeneficiarioCalculadas && resultados.cessoesBeneficiarioCalculadas.length > 0;
            if (!temCessoesBeneficiario) return null;
            
            let secaoPrevidencia = '';
            if (temPrevidencia) {
                secaoPrevidencia = tipoPrevidencia === 'fixa'
                    ? gerarDetalhePrevidenciaFixa(resultados, dados, temCessoesBeneficiario)
                    : gerarDetalhePrevidenciaINSS(resultados, dados, temCessoesBeneficiario);
            }
            
            let secaoIR = '';
            if (temIR) {
                secaoIR = gerarDetalheIR(resultados, dados, temPrevidencia, temCessoesBeneficiario);
            }
            
            if (!secaoPrevidencia && !secaoIR) return null;
            
            return `
                <div style="margin-bottom: 30px; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px;">
                    <p style="color: #155724; font-style: italic; margin-bottom: 15px;">
                        <strong>Deduções do Beneficiário Principal:</strong> ${dados.beneficiario}
                        <span style="color: #856404;"> - R$ ${formatarMoeda(resultados.valorBase)}</span>
                    </p>
                    ${secaoPrevidencia}
                    ${secaoIR}
                </div>
            `;
        }

        function gerarSecoesHerdeiros(herdeirosFiltrados, dados, temPrevidencia, temIR, tipoPrevidencia, isPreferencia) {
            if (herdeirosFiltrados.length === 0) return [];
            
            const baseGroups = agruparHerdeirosPorBase(herdeirosFiltrados);
            const secoes = [];
            
            baseGroups.forEach((herdeiros, base) => {
                const valorBase = parseFloat(base);
                const herdeirosNomes = herdeiros.map(h => h.nome).join(', ');
                const primeiroHerdeiro = herdeiros[0];
                const temAlgumParcial = herdeiros.some(h => h.isPreferenciaParcial);
                
                let secaoPrevidencia = '';
                if (temPrevidencia) {
                    if (isPreferencia) {
                        // Preferência: usa funções SemCessao
                        secaoPrevidencia = tipoPrevidencia === 'fixa'
                            ? gerarDetalhePrevidenciaFixaHerdeirosSemCessao(herdeiros, dados, valorBase)
                            : gerarDetalhePrevidenciaINSSHerdeirosSemCessao(herdeiros, dados, valorBase);
                    } else {
                        // Ordem: usa funções normais
                        secaoPrevidencia = tipoPrevidencia === 'fixa'
                            ? gerarDetalhePrevidenciaFixaHerdeiros(herdeiros, dados, valorBase)
                            : gerarDetalhePrevidenciaINSSHerdeiros(herdeiros, dados, valorBase);
                    }
                }
                
                let secaoIR = '';
                if (temIR && primeiroHerdeiro.rrapagamento !== 0) {
                    secaoIR = isPreferencia
                        ? gerarDetalheIRHerdeirosSemCessao(herdeiros, dados, valorBase, temPrevidencia, temAlgumParcial)
                        : gerarDetalheIRHerdeiros(herdeiros, dados, valorBase, temPrevidencia, false);
                }
                
                if (secaoPrevidencia || secaoIR) {
                    const extraInfo = isPreferencia 
                        ? (temAlgumParcial ? ' <em>(Preferência Parcial)</em>' : ' <em>(Preferência Total)</em>')
                        : '';
                    
                    secoes.push(`
                        <div style="margin-bottom: 30px; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px;">
                            <p style="color: #155724; font-style: italic; margin-bottom: 15px;">
                                <strong>Deduções de:</strong> ${herdeirosNomes}
                                <span style="color: #856404;"> - R$ ${formatarMoeda(valorBase)}</span>
                                ${extraInfo}
                            </p>
                            ${secaoPrevidencia}
                            ${secaoIR}
                        </div>
                    `);
                }
            });
            
            return secoes;
        }

        function agruparHerdeirosPorBase(herdeiros) {
            const baseGroups = new Map();
            herdeiros.forEach(h => {
                const baseKey = h.valorTotal.toFixed(2);
                if (!baseGroups.has(baseKey)) baseGroups.set(baseKey, []);
                baseGroups.get(baseKey).push(h);
            });
            return baseGroups;
        }

        function montarResultadoFinal(secoes, tipo) {
            const titulos = {
                'ordem': '🏦 Deduções Legais',
                'preferencia_total': '🏦 Deduções Legais - Preferência Total',
                'preferencia_parcial': '🏦 Deduções Legais - Preferência (Parcial/Total)'
            };
            
            const explicacoes = {
                'ordem': `
                    • <strong>Beneficiário principal:</strong> Discrimina cessões quando aplicável<br>
                    • <strong>Herdeiros agrupados:</strong> Por valor igual, com cessões individuais<br>
                    • <strong>Cálculos específicos</strong> para cada situação
                `,
                'preferencia_total': `
                    • <strong>Herdeiros agrupados</strong> por valor igual, com cálculos específicos<br>
                    • <strong>Previdência e IR</strong> individuais por herdeiro<br>
                    • <strong>Cessões não aplicáveis</strong> na preferência (cessionários aguardam ordem cronológica)
                `,
                'preferencia_parcial': `
                    • <strong>Herdeiros agrupados</strong> por valor igual, com cálculos específicos<br>
                    • <strong>Previdência e IR</strong> individuais por herdeiro<br>
                    • <strong>Cessões não aplicáveis</strong> na preferência (cessionários aguardam ordem cronológica)
                `
            };
            
            return `
                <div class="deducoes-legais">
                    <div class="table-container">
                        <h3>${titulos[tipo]}</h3>
                        ${secoes.join('')}
                        <div style="margin-top: 10px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 0.9em;">
                            <strong>💡 Explicação:</strong><br>
                            ${explicacoes[tipo]}
                        </div>
                    </div>
                </div>
            `;
        }

        function gerarDeducoesSimples(resultados, dados, temPrevidencia, temIR) {
            const temCessoes = resultados.cessoesBeneficiarioCalculadas && resultados.cessoesBeneficiarioCalculadas.length > 0;
            const isPJ = dados.natureza === 'comum' && dados.tipoBeneficiario === 'pj';

            const tipoPrevidencia = dados.valoresPrincipais?.find(item => item.tributacao?.tipoPrevidencia)?.tributacao.tipoPrevidencia || null;
            
            let secaoPrevidencia = '';
            if (temPrevidencia && !isPJ) { // PJ não tem previdência
                if (tipoPrevidencia === 'fixa') {
                    secaoPrevidencia = gerarDetalhePrevidenciaFixa(resultados, dados, temCessoes);
                } else {
                    secaoPrevidencia = gerarDetalhePrevidenciaINSS(resultados, dados, temCessoes);
                }
            }
            
            let secaoIR = '';
            if (temIR) {
                if (isPJ) {
                    secaoIR = gerarDetalheIRPJ(resultados, dados, temCessoes);
                } else {
                    secaoIR = gerarDetalheIR(resultados, dados, temPrevidencia, temCessoes);
                }
            }

            if (!secaoPrevidencia && !secaoIR) {
                return '';
            }
            
            const titulo = isPJ ? '🏦 Deduções Legais - Pessoa Jurídica' : '🏦 Deduções Legais';
            
            return `
                <div class="deducoes-legais">
                    <div class="table-container">
                        <h3>${titulo}</h3>
                        ${secaoPrevidencia}
                        ${secaoIR}
                    </div>
                </div>
            `;
        }

        function gerarDetalhePrevidenciaFixa(resultados, dados, temCessoes) {
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            let valorSemDesagio = resultados.valorPrevidencia;
            let valorDesagio = 0;
            let valorComDesagio = resultados.valorPrevidencia;
            
            if (isAcordo && resultados.valorDesagioPrevidencia) {
                valorComDesagio = resultados.valorPrevidencia; // valor final (já com deságio)
                valorDesagio = resultados.valorDesagioPrevidencia; // valor do desconto
                valorSemDesagio = resultados.valorPrevidencia + resultados.valorDesagioPrevidencia; // valor original
            }

            const aliquotaFixa = dados.valoresPrincipais?.find(item => item.tributacao?.aliquotaFixa)?.tributacao.aliquotaFixa || 0;

            const distribuicaoCessoes = temCessoes ? `
                <tr style="border-top: 1px solid #dee2e6;">
                    <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                </tr>
                ${resultados.valorPrevidenciaBeneficiario > 0 ? `
                <tr>
                    <th>${dados.beneficiario}:</th>
                    <td>R$ ${formatarMoeda(resultados.valorPrevidenciaBeneficiario)}</td>
                </tr>` : ''}
                ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
                    cessao.previdenciaCessao > 0 ? `
                <tr>
                    <th>${cessao.cessionario}:</th>
                    <td>R$ ${formatarMoeda(cessao.previdenciaCessao)}</td>
                </tr>` : ''
                ).join('') : ''}
            ` : '';
            
            return `
                <table class="ir-table">
                    <tr>
                        <th colspan="2" class="section-header">📄 Previdência - Alíquota Fixa</th>
                    </tr>
                    <tr>
                        <th>Principal:</th>
                        <td>R$ ${formatarMoeda(resultados.principal)}</td>
                    </tr>
                    <tr>
                        <th>Alíquota Fixa:</th>
                        <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
                    </tr>
                    <tr ${!isAcordo ? 'class="total-row"' : ''}>
                        <th>Valor Previdência ${isAcordo ? 'sem Deságio' : ''}:</th>
                        <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
                    </tr>
                    ${isAcordo && valorDesagio > 0 ? `
                    <tr style="color: #dc3545;">
                        <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                        <td>R$ ${formatarMoeda(valorDesagio)}</td>
                    </tr>
                    <tr class="total-row">
                        <th>Valor Previdência com Deságio:</th>
                        <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
                    </tr>` : ''}
                    ${distribuicaoCessoes}
                </table>
            `;
        }

        function gerarDetalhePrevidenciaINSS(resultados, dados, temCessoes) {
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            const base = resultados.rrapagamento === 0 ? resultados.principal : resultados.principal / resultados.rrapagamento;
            
            let valorSemDesagio = resultados.valorPrevidencia;
            let valorDesagio = 0;
            let valorComDesagio = resultados.valorPrevidencia;
            
            if (isAcordo && resultados.valorDesagioPrevidencia) {
                valorComDesagio = resultados.valorPrevidencia; // valor final (já com deságio)
                valorDesagio = resultados.valorDesagioPrevidencia; // valor do desconto
                valorSemDesagio = resultados.valorPrevidencia + resultados.valorDesagioPrevidencia; // valor original
            }
            
            const distribuicaoCessoes = temCessoes ? `
                <tr style="border-top: 1px solid #dee2e6;">
                    <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                </tr>
                ${resultados.valorPrevidenciaBeneficiario > 0 ? `
                <tr>
                    <th>${dados.beneficiario}:</th>
                    <td>R$ ${formatarMoeda(resultados.valorPrevidenciaBeneficiario)}</td>
                </tr>` : ''}
                ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
                    cessao.previdenciaCessao > 0 ? `
                <tr>
                    <th>${cessao.cessionario}:</th>
                    <td>R$ ${formatarMoeda(cessao.previdenciaCessao)}</td>
                </tr>` : ''
                ).join('') : ''}
            ` : '';
            
            return `
                <table class="ir-table">
                    <tr>
                        <th colspan="2" class="section-header">📄 Previdência - INSS</th>
                    </tr>
                    <tr>
                        <th>Principal:</th>
                        <td>R$ ${formatarMoeda(resultados.principal)}</td>
                    </tr>
                    ${resultados.rrapagamento !== 0 ? `
                    <tr>
                        <th>RRA Pagamento:</th>
                        <td>${arredondarRRA(resultados.rrapagamento)}</td>
                    </tr>
                    <tr>
                        <th>Base INSS por RRA:</th>
                        <td>R$ ${formatarMoeda(base)}</td>
                    </tr>` : ''}
                    <tr>
                        <th>Alíquota Efetiva INSS:</th>
                        <td>${(resultados.aliquotaEfetiva * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <th>Valor INSS por RRA:</th>
                        <td>R$ ${formatarMoeda(valorSemDesagio / (resultados.rrapagamento || 1))} ${base > 8157.41 ? '(TETO)' : ''}</td>
                    </tr>
                    <tr ${!isAcordo ? 'class="total-row"' : ''}>
                        <th>Valor Previdência ${isAcordo ? 'sem Deságio' : ''}:</th>
                        <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
                    </tr>
                    ${isAcordo && valorDesagio > 0 ? `
                    <tr style="color: #dc3545;">
                        <th>(-) Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                        <td>R$ ${formatarMoeda(valorDesagio)}</td>
                    </tr>
                    <tr class="total-row">
                        <th>Valor Previdência com Deságio:</th>
                        <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
                    </tr>` : ''}
                    ${distribuicaoCessoes}
                </table>
            `;
        }

        function gerarDetalheIR(resultados, dados, temPrevidencia, temCessoes) {
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;

            let percentualTotalAdv = 0;
            let percentualTotalSind = 0;
            
            if (dados.tipoCalculo === 'preferencia') {
                percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
                percentualTotalSind = 0;
            } else {
                percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
                percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
            }

            let baseComDesagio = '';
            if (isAcordo && resultados.percentualDesagioIR > 0) {
                baseComDesagio = `
                <tr>
                    <th>Base IR com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                    <td>R$ ${formatarMoeda(resultados.principalComDesagio)}</td>
                </tr>`;
            }

            const temIRParaDistribuir = temCessoes && (
                (resultados.valorIRBeneficiario > 0) ||
                (resultados.cessoesBeneficiarioFinais?.some(c => c.irCessao > 0))
            );

            
            const distribuicaoCessoes = temIRParaDistribuir ? `
                <tr style="border-top: 1px solid #dee2e6;">
                    <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                </tr>
                ${resultados.valorIRBeneficiario > 0 ? `
                <tr>
                    <th>${dados.beneficiario}:</th>
                    <td>R$ ${formatarMoeda(resultados.valorIRBeneficiario)}</td>
                </tr>
                ` : ''}
                ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
                    cessao.irCessao > 0 ? `
                    <tr>
                        <th>${cessao.cessionario}:</th>
                        <td>R$ ${formatarMoeda(cessao.irCessao)}</td>
                    </tr>
                    ` : ''
                ).join('') : ''}
            ` : '';
            
            return `
                <table class="ir-table">
                    <tr>
                        <th colspan="2" class="section-header">📄 Imposto de Renda - LEI Nº 15.191, DE 11 DE AGOSTO DE 2025</th>
                    </tr>
                    <tr>
                        <th>Principal:</th>
                        <td>R$ ${formatarMoeda(resultados.principal)}</td>
                    </tr>
                    <tr>
                        <th>Base IR sem H.Contratuais (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(resultados.baseIRHonora)}</td>
                    </tr>
                    ${percentualTotalSind > 0 ? `
                    <tr>
                        <th>Base IR sem Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(resultados.baseIRSindi)}</td>
                    </tr>` : ''}
                    ${baseComDesagio}
                    ${temPrevidencia ? `
                    <tr>
                        <th>Previdência:</th>
                        <td>R$ ${formatarMoeda(resultados.valorPrevidencia)}</td>
                    </tr>
                    <tr>
                        <th>Base IR sem Previdência:</th>
                        <td>R$ ${formatarMoeda(resultados.baseIRPrev)}</td>
                    </tr>` : ''}
                    <tr>
                        <th>RRA Pagamento:</th>
                        <td>${arredondarRRA(resultados.rraComDesagio || resultados.rrapagamento)}</td>
                    </tr>
                    <tr>
                        <th>Base IR por RRA:</th>
                        <td>R$ ${formatarMoeda(resultados.baseIRRRA)}</td>
                    </tr>
                    <tr>
                        <th>Alíquota IR:</th>
                        <td>${(resultados.aliquotaIR * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <th>Valor IR Mensal:</th>
                        <td>R$ ${formatarMoeda(resultados.valorIRUnitario)}</td>
                    </tr>
                    <tr class="total-row">
                        <th>Valor IR Devido Total:</th>
                        <td><strong>R$ ${formatarMoeda(resultados.valorIR)}</strong></td>
                    </tr>
                    ${distribuicaoCessoes}
                </table>
            `;
        }

        function gerarDetalheIRPJ(resultados, dados, temCessoes) {
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            let percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
            let percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
            
            const baseSemHonorarios = resultados.valortotatt - (resultados.valortotatt * percentualTotalAdv);
            const baseSemSindicatos = baseSemHonorarios - (resultados.valortotatt * percentualTotalSind);
            
            let baseComDesagio = '';
            if (isAcordo && percentualDesagio > 0) {
                const baseAposDesagio = baseSemSindicatos * (1 - percentualDesagio);
                
                baseComDesagio = `
                <tr>
                    <th>Base IR com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                    <td>R$ ${formatarMoeda(baseAposDesagio)}</td>
                </tr>`;
            }
            
            const distribuicaoCessoes = temCessoes ? `
                <tr style="border-top: 1px solid #dee2e6;">
                    <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                </tr>
                ${resultados.valorIRBeneficiario > 0 ? `
                <tr>
                    <th>${dados.beneficiario}:</th>
                    <td>R$ ${formatarMoeda(resultados.valorIRBeneficiario)}</td>
                </tr>
                ` : ''}
                ${resultados.cessoesBeneficiarioFinais ? resultados.cessoesBeneficiarioFinais.map((cessao) => 
                    cessao.irCessao > 0 ? `
                    <tr>
                        <th>${cessao.cessionario}:</th>
                        <td>R$ ${formatarMoeda(cessao.irCessao)}</td>
                    </tr>
                    ` : ''
                ).join('') : ''}
            ` : '';
            
            return `
                <table class="ir-table">
                    <tr>
                        <th colspan="2" class="section-header">📄 Imposto de Renda PJ - Art. 27, da Lei nº 10.833/03</th>
                    </tr>
                    <tr>
                        <th>Valor Total:</th>
                        <td>R$ ${formatarMoeda(resultados.valortotatt)}</td>
                    </tr>
                    <tr>
                        <th>Base IR sem H.Contratuais (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(baseSemHonorarios)}</td>
                    </tr>
                    ${percentualTotalSind > 0 ? `
                    <tr>
                        <th>Base IR sem Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(baseSemSindicatos)}</td>
                    </tr>` : ''}
                    ${baseComDesagio}
                    <tr>
                        <th>Alíquota IR:</th>
                        <td>3,0%</td>
                    </tr>
                    <tr class="total-row">
                        <th>Valor IR Devido Total:</th>
                        <td><strong>R$ ${formatarMoeda(resultados.valorIR)}</strong></td>
                    </tr>
                    ${distribuicaoCessoes}
                </table>
            `;
        }

        function gerarDetalhePrevidenciaFixaHerdeirosSemCessao(herdeiros, dados, valorBase) {
            const primeiroHerdeiro = herdeiros[0];
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
            let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
            
            if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
                valorComDesagio = primeiroHerdeiro.valorPrevidencia; 
                valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; 
            }
            
            // Distribuição por herdeiros
            const distribuicaoHerdeiros = herdeiros.map(herdeiro => `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
                </tr>
            `).join('');

            const aliquotaFixa = dados.valoresPrincipais?.find(item => item.tributacao?.aliquotaFixa)?.tributacao.aliquotaFixa || 0;
            
            return `
                <table class="ir-table" style="margin-bottom: 15px;">
                    <tr>
                        <th colspan="2" class="section-header">📄 Previdência - Alíquota Fixa</th>
                    </tr>
                    <tr>
                        <th>Principal (base):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
                    </tr>
                    <tr>
                        <th>Alíquota Fixa:</th>
                        <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
                    </tr>
                    <tr ${!isAcordo ? 'class="total-row"' : ''}>
                        <th>Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</th>
                        <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
                    </tr>
                    ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
                    <tr class="total-row">
                        <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                        <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
                    </tr>` : ''}
                    <tr style="border-top: 1px solid #dee2e6;">
                        <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                    </tr>
                    ${distribuicaoHerdeiros}
                </table>
            `;
        }

        function gerarDetalhePrevidenciaINSSHerdeirosSemCessao(herdeiros, dados, valorBase) {
            const primeiroHerdeiro = herdeiros[0];
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            const base = primeiroHerdeiro.rrapagamento === 0 ? primeiroHerdeiro.principal : primeiroHerdeiro.principal / primeiroHerdeiro.rrapagamento;
            
            let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
            let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
            
            if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
                valorComDesagio = primeiroHerdeiro.valorPrevidencia; // valor final (já com deságio)
                valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; // valor original
            }

            const distribuicaoHerdeiros = herdeiros.map(herdeiro => `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
                </tr>
            `).join('');
            
            return `
                <table class="ir-table" style="margin-bottom: 15px;">
                    <tr>
                        <th colspan="2" class="section-header">📄 Previdência - INSS</th>
                    </tr>
                    <tr>
                        <th>Principal (base):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
                    </tr>
                    ${primeiroHerdeiro.rrapagamento !== 0 ? `
                    <tr>
                        <th>RRA Pagamento:</th>
                        <td>${arredondarRRA(primeiroHerdeiro.rrapagamento)}</td>
                    </tr>
                    <tr>
                        <th>Base INSS por RRA:</th>
                        <td>R$ ${formatarMoeda(base)}</td>
                    </tr>` : ''}
                    <tr>
                        <th>Alíquota Efetiva INSS:</th>
                        <td>${(primeiroHerdeiro.aliquotaEfetiva * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <th>Valor INSS por RRA:</th>
                        <td>R$ ${formatarMoeda(valorSemDesagio / (primeiroHerdeiro.rrapagamento || 1))} ${base > 8157.41 ? '(TETO)' : ''}</td>
                    </tr>
                    <tr ${!isAcordo ? 'class="total-row"' : ''}>
                        <th>Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</th>
                        <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
                    </tr>
                    ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
                    <tr class="total-row">
                        <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                        <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
                    </tr>` : ''}
                    <tr style="border-top: 1px solid #dee2e6;">
                        <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                    </tr>
                    ${distribuicaoHerdeiros}
                </table>
            `;
        }

        function gerarDetalheIRHerdeirosSemCessao(herdeiros, dados, valorBase, temPrevidencia, temAlgumParcial) {
            const primeiroHerdeiro = herdeiros[0];
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            // Calcula percentuais 
            let percentualTotalAdv = 0;
            let percentualTotalSind = 0;

            if (dados.tipoCalculo === 'preferencia') {
                percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
                percentualTotalSind = 0; // Sindicatos não recebem na preferência
            } else {
                // ORDEM CRONOLÓGICA
                percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
                percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
            }
            
            //acordo
            let baseComDesagio = '';
            if (isAcordo && percentualDesagio > 0) {
                baseComDesagio = `
                <tr>
                    <th>Base IR com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                    <td>R$ ${formatarMoeda(primeiroHerdeiro.principalComDesagio || primeiroHerdeiro.baseIRSindi)}</td>
                </tr>`;
            }
            
            const distribuicaoHerdeiros = herdeiros.map(herdeiro => `
                <tr>
                    <th>${herdeiro.nome}:</th>
                    <td>R$ ${formatarMoeda(herdeiro.valorIR)}</td>
                </tr>
            `).join('');
            
            return `
                <table class="ir-table" style="margin-bottom: 15px;">
                    <tr>
                        <th colspan="2" class="section-header">📄 Imposto de Renda - LEI Nº 15.191, DE 11 DE AGOSTO DE 2025</th>
                    </tr>
                    <tr>
                        <th>Principal (base):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
                    </tr>
                    <tr>
                        <th>Base IR sem H.Contratuais (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRHonora)}</td>
                    </tr>
                    ${percentualTotalSind > 0 ? `
                    <tr>
                        <th>Base IR sem Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi)}</td>
                    </tr>` : ''}
                    ${baseComDesagio}
                    ${temPrevidencia ? `
                    <tr>
                        <th>Previdência:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.valorPrevidencia)}</td>
                    </tr>
                    <tr>
                        <th>Base IR sem Previdência:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRPrev)}</td>
                    </tr>` : ''}
                    <tr>
                        <th>RRA Pagamento:</th>
                        <td>${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)}</td>
                    </tr>
                    <tr>
                        <th>Base IR por RRA:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRRRA)}</td>
                    </tr>
                    <tr>
                        <th>Alíquota IR:</th>
                        <td>${(primeiroHerdeiro.aliquotaIR * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <th>Valor IR Mensal:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.valorIRUnitario)}</td>
                    </tr>
                    <tr class="total-row">
                        <th>Valor IR Devido Total por Herdeiro:</th>
                        <td><strong>R$ ${formatarMoeda(primeiroHerdeiro.valorIR)}</strong></td>
                    </tr>
                    <tr style="border-top: 1px solid #dee2e6;">
                        <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                    </tr>
                    ${distribuicaoHerdeiros}
                </table>
            `;
        }

        function gerarDetalhePrevidenciaFixaHerdeiros(herdeiros, dados, valorBase) {
            const primeiroHerdeiro = herdeiros[0];
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
            let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
            
            if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
                valorComDesagio = primeiroHerdeiro.valorPrevidencia; // valor final (já com deságio)
                valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; // valor original
            }

            const aliquotaFixa = dados.valoresPrincipais?.find(item => item.tributacao?.aliquotaFixa)?.tributacao.aliquotaFixa || 0;
            
            const distribuicaoHerdeiros = herdeiros.map(herdeiro => {
                const temCessoes = herdeiro.cessoesHerdeiro && herdeiro.cessoesHerdeiro.length > 0;
                
                if (!temCessoes) {
                    return `
                        <tr>
                            <th>${herdeiro.nome}:</th>
                            <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
                        </tr>
                    `;
                } else {
                    // Com cessões - distribui proporcionalmente
                    const valorPrevidenciaTotal = herdeiro.valorPrevidencia;
                    const cessoesTotais = herdeiro.cessoesHerdeiro.reduce((total, cessao) => total + cessao.percentual, 0);
                    const percentualHerdeiro = 1.0 - cessoesTotais;
                    
                    const valorHerdeiro = valorPrevidenciaTotal * percentualHerdeiro;
                    
                    let linhas = `
                        <tr>
                            <th>${herdeiro.nome}:</th>
                            <td>R$ ${formatarMoeda(valorHerdeiro)}</td>
                        </tr>
                    `;
                    
                    herdeiro.cessoesHerdeiro.forEach(cessao => {
                        const valorCessionario = valorPrevidenciaTotal * cessao.percentual;
                        linhas += `
                            <tr>
                                <th style="padding-left: 20px;">${cessao.cessionario} (Cessionário de ${herdeiro.nome} - ${(cessao.percentual * 100).toFixed(2)}%):</th>
                                <td>R$ ${formatarMoeda(valorCessionario)}</td>
                            </tr>
                        `;
                    });
                    
                    return linhas;
                }
            }).join('');
            
            return `
                <table class="ir-table" style="margin-bottom: 15px;">
                    <tr>
                        <th colspan="2" class="section-header">📄 Previdência - Alíquota Fixa</th>
                    </tr>
                    <tr>
                        <th>Principal (base):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
                    </tr>
                    <tr>
                        <th>Alíquota Fixa:</th>
                        <td>${(aliquotaFixa * 100).toFixed(2)}%</td>
                    </tr>
                    <tr ${!isAcordo ? 'class="total-row"' : ''}>
                        <th>Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</th>
                        <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
                    </tr>
                    ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
                    <tr class="total-row">
                        <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                        <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
                    </tr>` : ''}
                    <tr style="border-top: 1px solid #dee2e6;">
                        <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                    </tr>
                    ${distribuicaoHerdeiros}
                </table>
            `;
        }

        function gerarDetalhePrevidenciaINSSHerdeiros(herdeiros, dados, valorBase) {
            const primeiroHerdeiro = herdeiros[0];
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            const base = primeiroHerdeiro.rrapagamento === 0 ? primeiroHerdeiro.principal : primeiroHerdeiro.principal / primeiroHerdeiro.rrapagamento;
            
            let valorSemDesagio = primeiroHerdeiro.valorPrevidencia;
            let valorComDesagio = primeiroHerdeiro.valorPrevidencia;
            
            if (isAcordo && primeiroHerdeiro.valorDesagioPrevidencia) {
                valorComDesagio = primeiroHerdeiro.valorPrevidencia; // valor final (já com deságio)
                valorSemDesagio = primeiroHerdeiro.valorPrevidencia + primeiroHerdeiro.valorDesagioPrevidencia; // valor original
            }
            
            const distribuicaoHerdeiros = herdeiros.map(herdeiro => {
                const temCessoes = herdeiro.cessoesHerdeiro && herdeiro.cessoesHerdeiro.length > 0;
                
                if (!temCessoes) {
                    return `
                        <tr>
                            <th>${herdeiro.nome}:</th>
                            <td>R$ ${formatarMoeda(herdeiro.valorPrevidencia)}</td>
                        </tr>
                    `;
                } else {
                    const valorPrevidenciaTotal = herdeiro.valorPrevidencia;
                    const cessoesTotais = herdeiro.cessoesHerdeiro.reduce((total, cessao) => total + cessao.percentual, 0);
                    const percentualHerdeiro = 1.0 - cessoesTotais;
                    
                    const valorHerdeiro = valorPrevidenciaTotal * percentualHerdeiro;
                    
                    let linhas = `
                        <tr>
                            <th>${herdeiro.nome}:</th>
                            <td>R$ ${formatarMoeda(valorHerdeiro)}</td>
                        </tr>
                    `;
                    
                    herdeiro.cessoesHerdeiro.forEach(cessao => {
                        const valorCessionario = valorPrevidenciaTotal * cessao.percentual;
                        linhas += `
                            <tr>
                                <th style="padding-left: 20px;">${cessao.cessionario} (Cessionário de ${herdeiro.nome} - ${(cessao.percentual * 100).toFixed(2)}%):</th>
                                <td>R$ ${formatarMoeda(valorCessionario)}</td>
                            </tr>
                        `;
                    });
                    
                    return linhas;
                }
            }).join('');
            
            return `
                <table class="ir-table" style="margin-bottom: 15px;">
                    <tr>
                        <th colspan="2" class="section-header">📄 Previdência - INSS</th>
                    </tr>
                    <tr>
                        <th>Principal (base):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
                    </tr>
                    ${primeiroHerdeiro.rrapagamento !== 0 ? `
                    <tr>
                        <th>RRA Pagamento:</th>
                        <td>${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)}</td>
                    </tr>
                    <tr>
                        <th>Base INSS por RRA:</th>
                        <td>R$ ${formatarMoeda(base)}</td>
                    </tr>` : ''}
                    <tr>
                        <th>Alíquota Efetiva INSS:</th>
                        <td>${(primeiroHerdeiro.aliquotaEfetiva * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <th>Valor INSS por RRA:</th>
                        <td>R$ ${formatarMoeda(valorSemDesagio / (primeiroHerdeiro.rrapagamento || 1))} ${base > 8157.41 ? '(TETO)' : ''}</td>
                    </tr>
                    <tr ${!isAcordo ? 'class="total-row"' : ''}>
                        <th>Valor Previdência ${isAcordo ? 'sem Deságio' : 'por Herdeiro'}:</th>
                        <td>${!isAcordo ? '<strong>' : ''}R$ ${formatarMoeda(valorSemDesagio)}${!isAcordo ? '</strong>' : ''}</td>
                    </tr>
                    ${isAcordo && primeiroHerdeiro.valorDesagioPrevidencia > 0 ? `
                    <tr class="total-row">
                        <th>Valor Previdência com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                        <td><strong>R$ ${formatarMoeda(valorComDesagio)}</strong></td>
                    </tr>` : ''}
                    <tr style="border-top: 1px solid #dee2e6;">
                        <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                    </tr>
                    ${distribuicaoHerdeiros}
                </table>
            `;
        }

        function gerarDetalheIRHerdeiros(herdeiros, dados, valorBase, temPrevidencia, temAlgumParcial) {
            const primeiroHerdeiro = herdeiros[0];
            const isAcordo = dados.tipoCalculo === 'acordo';
            const percentualDesagio = dados.percentualAcordo || 0;
            
            let percentualTotalAdv = 0;
            let percentualTotalSind = 0;

            if (dados.tipoCalculo === 'preferencia') {
                percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
                percentualTotalSind = 0; // Sindicatos não recebem na preferência
            } else {
                // ORDEM CRONOLÓGICA
                percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
                percentualTotalSind = dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
            }
            
            let baseComDesagio = '';
            if (isAcordo && percentualDesagio > 0) {
                baseComDesagio = `
                <tr>
                    <th>Base IR com Deságio ${(percentualDesagio * 100).toFixed(2)}%:</th>
                    <td>R$ ${formatarMoeda(primeiroHerdeiro.principalComDesagio || primeiroHerdeiro.baseIRSindi)}</td>
                </tr>`;
            }
            
            const distribuicaoHerdeiros = herdeiros.map(herdeiro => {
                const temCessoes = herdeiro.cessoesHerdeiro && herdeiro.cessoesHerdeiro.length > 0;
                
                if (!temCessoes) {
                    return `
                        <tr>
                            <th>${herdeiro.nome}:</th>
                            <td>R$ ${formatarMoeda(herdeiro.valorIR)}</td>
                        </tr>
                    `;
                } else {
                    const valorIRTotal = herdeiro.valorIR;
                    const cessoesTotais = herdeiro.cessoesHerdeiro.reduce((total, cessao) => total + cessao.percentual, 0);
                    const percentualHerdeiro = 1.0 - cessoesTotais;
                    
                    const valorHerdeiro = valorIRTotal * percentualHerdeiro;
                    
                    let linhas = `
                        <tr>
                            <th>${herdeiro.nome}:</th>
                            <td>R$ ${formatarMoeda(valorHerdeiro)}</td>
                        </tr>
                    `;
                    
                    herdeiro.cessoesHerdeiro.forEach(cessao => {
                        const valorCessionario = valorIRTotal * cessao.percentual;
                        linhas += `
                            <tr>
                                <th style="padding-left: 20px;">${cessao.cessionario} (Cessionário de ${herdeiro.nome} - ${(cessao.percentual * 100).toFixed(2)}%):</th>
                                <td>R$ ${formatarMoeda(valorCessionario)}</td>
                            </tr>
                        `;
                    });
                    
                    return linhas;
                }
            }).join('');
            
            return `
                <table class="ir-table" style="margin-bottom: 15px;">
                    <tr>
                        <th colspan="2" class="section-header">📄 Imposto de Renda - LEI Nº 15.191, DE 11 DE AGOSTO DE 2025</th>
                    </tr>
                    <tr>
                        <th>Principal (base):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.principal)}</td>
                    </tr>
                    <tr>
                        <th>Base IR sem H.Contratuais (${(percentualTotalAdv * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRHonora)}</td>
                    </tr>
                    ${percentualTotalSind > 0 ? `
                    <tr>
                        <th>Base IR sem Sindicatos (${(percentualTotalSind * 100).toFixed(2)}%):</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRSindi)}</td>
                    </tr>` : ''}
                    ${baseComDesagio}
                    ${temPrevidencia ? `
                    <tr>
                        <th>Previdência:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.valorPrevidencia)}</td>
                    </tr>
                    <tr>
                        <th>Base IR sem Previdência:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRPrev)}</td>
                    </tr>` : ''}
                    <tr>
                        <th>RRA Pagamento:</th>
                        <td>${arredondarRRA(primeiroHerdeiro.rraComDesagio || primeiroHerdeiro.rrapagamento)}</td>
                    </tr>
                    <tr>
                        <th>Base IR por RRA:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.baseIRRRA)}</td>
                    </tr>
                    <tr>
                        <th>Alíquota IR:</th>
                        <td>${(primeiroHerdeiro.aliquotaIR * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <th>Valor IR Mensal:</th>
                        <td>R$ ${formatarMoeda(primeiroHerdeiro.valorIRUnitario)}</td>
                    </tr>
                    <tr class="total-row">
                        <th>Valor IR Devido Total por Herdeiro:</th>
                        <td><strong>R$ ${formatarMoeda(primeiroHerdeiro.valorIR)}</strong></td>
                    </tr>
                    <tr style="border-top: 1px solid #dee2e6;">
                        <th colspan="2" style="background-color: #f8f9fa; font-weight: bold;">📊 Distribuição:</th>
                    </tr>
                    ${distribuicaoHerdeiros}
                </table>
            `;
        }

        // Pagamento devido

        function arredondarParaDuasCasas(valor) {
            return Math.round(valor * 100) / 100;
        }

        function gerarSecoesPagamentos(resultados, dados) {
            const resultadosParaUsar = resultados.saldosFinais 
                ? ajustarResultadosComPagamentos(resultados, dados) 
                : resultados;
            
            if (dados.tipoCalculo === 'acordo') {
                return gerarTabelaPagamentosAcordo(resultadosParaUsar, dados);
            }

            const temHerdeiros = resultadosParaUsar.temHerdeiros && resultadosParaUsar.herdeiros.length > 0;

            return temHerdeiros
                ? gerarPagamentosComHerdeiros(resultadosParaUsar, dados)
                : gerarPagamentosSemHerdeiros(resultadosParaUsar, dados);
        }

        function gerarTabelaPagamentosAcordo(resultados, dados) {
            if (dados.tipoCalculo !== 'acordo') return '';
            
            const adesoes = obterAdesaoAcordo();
            const percentualDesagio = dados.percentualAcordo || 0;
            const pagamentosAcordo = [];
            
            // 1. BENEFICIÁRIO PRINCIPAL
            if (adesoes.beneficiario && resultados.valorBeneficiarioFinal > 0) {
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${dados.beneficiario} (Beneficiário)`,
                        resultados.valorBeneficiarioAposCessoes,
                        percentualDesagio,
                        resultados.valorPrevidenciaBeneficiario,
                        resultados.valorIRBeneficiario,
                        resultados.rraComDesagio || resultados.rrapagamento
                    )
                );
            }
            
            // 2. HERDEIROS QUE ADERIRAM
            if (resultados.temHerdeiros && adesoes.herdeiros.length > 0) {
                resultados.herdeiros.forEach((herdeiro, index) => {
                    if (adesoes.herdeiros.includes(index) && herdeiro.valorLiquido > 0) {
                        const valores = extrairValoresHerdeiro(herdeiro);
                        
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${herdeiro.nome} (Herdeiro)`,
                                valores.valorDevido,
                                percentualDesagio,
                                valores.previdencia,
                                valores.ir,
                                herdeiro.rraComDesagio || herdeiro.rrapagamento
                            )
                        );
                    }
                });
            }

            // 3. ADVOGADOS CONTRATUAIS QUE ADERIRAM
            if (adesoes.advogados.length > 0 && resultados.honorarios) {
                resultados.honorarios.forEach((advogado, index) => {
                    if (adesoes.advogados.includes(index) && advogado.valorBrutoAdvogado > 0) {
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${advogado.nome} (Adv. ${advogado.tipo})`,
                                advogado.valorBrutoAdvogado,
                                percentualDesagio,
                                0,
                                advogado.irAdvogado || 0,
                                '-'
                            )
                        );
                    }
                });
            }

            // 4. ADVOGADOS SUCUMBENCIAIS QUE ADERIRAM
            if (adesoes.advogadosSucumbenciais?.length > 0 && 
                resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais) {
                
                resultados.honorariosSucumbenciais.honorarios.forEach((advogado, index) => {
                    if (adesoes.advogadosSucumbenciais.includes(index) && advogado.valorBrutoAdvogado > 0) {
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${advogado.nome} (Adv. Sucumb. ${advogado.tipo})`,
                                advogado.valorBrutoAdvogado,
                                percentualDesagio,
                                0,
                                advogado.irAdvogado || 0,
                                '-'
                            )
                        );
                    }
                });
            }
            
            // 5. SINDICATOS QUE ADERIRAM
            if (adesoes.sindicatos.length > 0 && resultados.sindicatos) {
                resultados.sindicatos.forEach((sindicato, index) => {
                    if (adesoes.sindicatos.includes(index) && sindicato.valorBrutoSindicato > 0) {
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${sindicato.nome} (Sindicato)`,
                                sindicato.valorBrutoSindicato,
                                percentualDesagio,
                                0,
                                sindicato.irSindicato || 0,
                                '-'
                            )
                        );
                    }
                });
            }
            
            // 6. CESSIONÁRIOS
            coletarCessionariosAcordo(adesoes, dados, resultados, percentualDesagio, pagamentosAcordo);

            if (pagamentosAcordo.length === 0) return '';

            return montarTabelasAcordo(pagamentosAcordo, percentualDesagio);
        }

        function gerarPagamentosComHerdeiros(resultados, dados) {
            const isPreferencia = dados.tipoCalculo === 'preferencia';
            const herdeirosParaPagar = isPreferencia 
                ? resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial)
                : resultados.herdeiros;

            const herdeirosComPagamentos = herdeirosParaPagar.filter(h => 
                h.valorLiquido > 0 || (h.cessoesHerdeiro?.length > 0)
            );

            if (herdeirosComPagamentos.length === 0) return '';

            // Cessionários do beneficiário
            const secaoCessionariosBeneficiario = gerarSecaoCessionariosBeneficiario(resultados, dados);

            // Seções por herdeiro
            const secoesHerdeiros = herdeirosComPagamentos.map(herdeiro => 
                gerarTabelaHerdeiro(herdeiro, dados, isPreferencia, herdeirosComPagamentos.length)
            ).join('');

            // Honorários sucumbenciais
            const tabelaHonorariosSucumbenciais = gerarTabelaHonorariosSucumbenciais(resultados, dados);

            // Resumo geral
            const temHonorariosSucumbenciais = resultados.honorariosSucumbenciais?.honorarios?.some(adv => adv.temPreferencia) || false;
            const mostrarResumoGeral = herdeirosComPagamentos.length > 1 || temHonorariosSucumbenciais;

            let secaoResumoGeral = '';
            if (mostrarResumoGeral) {
                const todosPagamentos = coletarTodosPagamentos(resultados, dados);
                const totais = calcularTotaisUnificado(todosPagamentos);
                
                secaoResumoGeral = montarResumoGeral(totais);
            }

            return secaoCessionariosBeneficiario + secoesHerdeiros + tabelaHonorariosSucumbenciais + secaoResumoGeral;
        }

        function gerarTabelaHerdeiro(herdeiro, dados, isPreferencia, totalHerdeiros) {
            const pagamentosHerdeiro = [];

            // 1. O próprio herdeiro
            if (herdeiro.valorLiquido > 0) {
                const valores = extrairValoresHerdeiro(herdeiro);
                pagamentosHerdeiro.push({
                    credor: `${herdeiro.nome} (Herdeiro)`,
                    valorDevido: valores.valorDevido,
                    previdencia: valores.previdencia,
                    ir: valores.ir,
                    valorLiquido: herdeiro.valorLiquido
                });
            }

            // 2. Cessionários do herdeiro (só em ordem cronológica)
            if (!isPreferencia && herdeiro.cessoesHerdeiro?.length > 0) {
                herdeiro.cessoesHerdeiro
                    .filter(cessao => cessao.valorLiquido > 0)
                    .forEach(cessao => {
                        pagamentosHerdeiro.push({
                            credor: `${cessao.cessionario} (Cessionário de ${herdeiro.nome})`,
                            valorDevido: cessao.valorBruto,
                            previdencia: cessao.previdenciaCessao,
                            ir: cessao.irCessao,
                            valorLiquido: cessao.valorLiquido
                        });
                    });
            }

            // 3. Advogados e seus cessionários
            if (herdeiro.honorarios?.length > 0) {
                adicionarPagamentosAdvogados(
                    herdeiro.honorarios, 
                    pagamentosHerdeiro, 
                    isPreferencia, 
                    herdeiro
                );
            }

            // 4. Sindicatos e seus cessionários (não paga em preferência)
            if (!isPreferencia && herdeiro.sindicatos?.length > 0) {
                adicionarPagamentosSindicatos(herdeiro.sindicatos, pagamentosHerdeiro);
            }

            return montarTabelaHerdeiro(herdeiro, pagamentosHerdeiro, isPreferencia, totalHerdeiros);
        }

        function gerarTabelaHonorariosSucumbenciais(resultados, dados) {
            if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
                !resultados.honorariosSucumbenciais?.honorarios?.length) {
                return '';
            }

            const isPreferencia = dados.tipoCalculo === 'preferencia';
            const pagamentos = [];

            resultados.honorariosSucumbenciais.honorarios.forEach(adv => {
                const { deveReceberAdvogado, deveReceberCessionarios } = verificarRecebimentoSucumbencial(adv, isPreferencia);
                
                // Advogado sucumbencial
                if (deveReceberAdvogado && adv.valorBrutoAdvogado > 0) {
                    pagamentos.push({
                        credor: `${adv.nome} (Adv. Sucumbencial ${adv.tipo})`,
                        valorDevido: adv.valorBrutoAdvogado,
                        previdencia: 0,
                        ir: adv.irAdvogado || 0,
                        valorLiquido: adv.valorLiquidoAdvogado || 0
                    });
                }

                // Cessionários
                if (deveReceberCessionarios && adv.cessionarios?.length > 0) {
                    adv.cessionarios.forEach(cessionario => {
                        if (cessionario.valorLiquido > 0) {
                            pagamentos.push({
                                credor: `${cessionario.nome} (Cess. Adv. Sucumb. ${adv.nome})`,
                                valorDevido: cessionario.valorBruto,
                                previdencia: 0,
                                ir: cessionario.ir || 0,
                                valorLiquido: cessionario.valorLiquido
                            });
                        }
                    });
                }
            });

            if (pagamentos.length === 0) return '';

            return montarTabelaHonorariosSucumbenciais(pagamentos);
        }

        function gerarPagamentosSemHerdeiros(resultados, dados) {
            const todosPagamentos = coletarTodosPagamentosSemHerdeiros(resultados, dados);

            if (todosPagamentos.length === 0) return '';

            const totais = calcularTotaisUnificado(todosPagamentos);
            
            return montarTabelaPagamentosSemHerdeiros(todosPagamentos, totais);
        }

        function coletarTodosPagamentos(resultados, dados) {
            const pagamentos = [];
            const isPreferencia = dados.tipoCalculo === 'preferencia';

            // Cessionários do beneficiário
            adicionarCessionariosBeneficiario(resultados, dados, pagamentos);

            // Herdeiros
            const herdeirosParaPagar = isPreferencia 
                ? resultados.herdeiros.filter(h => h.temPreferencia || h.isPreferenciaParcial)
                : resultados.herdeiros;

            herdeirosParaPagar
                .filter(h => h.valorLiquido > 0)
                .forEach(herdeiro => {
                    const valores = extrairValoresHerdeiro(herdeiro);
                    
                    pagamentos.push({
                        credor: `${herdeiro.nome} (Herdeiro)`,
                        valorDevido: valores.valorDevido,
                        previdencia: valores.previdencia,
                        ir: valores.ir,
                        valorLiquido: herdeiro.valorLiquido
                    });

                    // Cessionários dos herdeiros (só ordem)
                    if (!isPreferencia && herdeiro.cessoesHerdeiro?.length > 0) {
                        adicionarCessoesHerdeiro(herdeiro, pagamentos);
                    }

                    // Advogados e seus cessionários
                    if (herdeiro.honorarios) {
                        adicionarPagamentosAdvogados(herdeiro.honorarios, pagamentos, isPreferencia, herdeiro);
                    }

                    // Sindicatos e seus cessionários
                    if (!isPreferencia && herdeiro.sindicatos) {
                        adicionarPagamentosSindicatos(herdeiro.sindicatos, pagamentos);
                    }
                });

            // Honorários sucumbenciais
            if (resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais) {
                resultados.honorariosSucumbenciais.honorarios.forEach(adv => {
                    if (adv.valorBrutoAdvogado > 0) {
                        pagamentos.push({
                            credor: `${adv.nome} (Adv. Sucumbencial ${adv.tipo})`,
                            valorDevido: adv.valorBrutoAdvogado,
                            previdencia: 0,
                            ir: adv.irAdvogado || 0,
                            valorLiquido: adv.valorLiquidoAdvogado || 0
                        });
                    }
                });
            }

            return pagamentos;
        }

        function coletarTodosPagamentosSemHerdeiros(resultados, dados) {
            const pagamentos = [];

            // Beneficiário
            if (resultados.valorBeneficiarioFinal > 0) {
                pagamentos.push({
                    credor: `${dados.beneficiario} (Beneficiário)`,
                    valorDevido: resultados.valorBeneficiarioAposCessoes,
                    previdencia: resultados.valorPrevidenciaBeneficiario,
                    ir: resultados.valorIRBeneficiario,
                    valorLiquido: resultados.valorBeneficiarioFinal
                });
            }

            // Cessionários do Beneficiário
            adicionarCessionariosBeneficiario(resultados, dados, pagamentos);

            // Sindicatos
            adicionarSindicatosBeneficiario(resultados, pagamentos);

            // Advogados
            adicionarAdvogadosBeneficiario(resultados, pagamentos);

            // Cessionários de Advogados
            const isPreferenciaParcial = dados.tipoCalculo === 'preferencia' && resultados.valorBase < resultados.valortotatt;
            if (!isPreferenciaParcial) {
                adicionarCessionariosAdvogadosBeneficiario(resultados, dados, pagamentos);
            }

            // Honorários Sucumbenciais
            adicionarHonorariosSucumbenciaisSemHerdeiros(resultados, dados, pagamentos);

            return pagamentos;
        }

        function calcularTotalDevido(pagamentos) {
            return pagamentos.reduce((total, p) => total + arredondarParaDuasCasas(p.valorDevido), 0);
        }

        function calcularTotalPrevidencia(pagamentos) {
            return pagamentos.reduce((total, p) => total + arredondarParaDuasCasas(p.previdencia), 0);
        }

        function calcularTotalIR(pagamentos) {
            return pagamentos.reduce((total, p) => total + arredondarParaDuasCasas(p.ir), 0);
        }

        function calcularTotalLiquido(pagamentos) {
            return pagamentos.reduce((total, p) => {
                const valorDevidoArredondado = arredondarParaDuasCasas(p.valorDevido);
                const previdenciaArredondada = arredondarParaDuasCasas(p.previdencia);
                const irArredondado = arredondarParaDuasCasas(p.ir);
                const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);
                return total + valorLiquidoCalculado;
            }, 0);
        }

        // ============================================================================
        // FUNÇÕES AUXILIARES DE PAGAMENTO
        // ============================================================================

        function criarPagamentoAcordo(credor, valorDevido, percentualDesagio, previdencia, ir, rra) {
            const valorDevidoArr = arredondarParaDuasCasas(valorDevido);
            const valorDesagio = arredondarParaDuasCasas(valorDevidoArr * percentualDesagio);
            const valorAposDesagio = arredondarParaDuasCasas(valorDevidoArr - valorDesagio);
            const previdenciaArr = arredondarParaDuasCasas(previdencia);
            const irArr = arredondarParaDuasCasas(ir);
            
            return {
                credor,
                valorDevido: valorDevidoArr,
                valorDesagio,
                valorAposDesagio,
                previdencia: previdenciaArr,
                ir: irArr,
                valorLiquido: arredondarParaDuasCasas(valorAposDesagio - previdenciaArr - irArr),
                rra
            };
        }

        function extrairValoresHerdeiro(herdeiro) {
            const temCessoes = herdeiro.cessoesHerdeiro?.length > 0;
            
            return {
                valorDevido: temCessoes ? herdeiro.valorFinalAposCessoes : herdeiro.valorBruto,
                previdencia: temCessoes ? herdeiro.valorPrevidenciaFinal : herdeiro.valorPrevidencia,
                ir: temCessoes ? herdeiro.valorIRFinal : herdeiro.valorIR
            };
        }

        function verificarRecebimentoSucumbencial(adv, isPreferencia) {
            const deveReceberAdvogado = !isPreferencia || adv.temPreferencia;
            
            let deveReceberCessionarios = true;
            if (isPreferencia) {
                if (!adv.temPreferencia || adv.foiLimitadoPorPreferencia) {
                    deveReceberCessionarios = false;
                }
            }
            
            return { deveReceberAdvogado, deveReceberCessionarios };
        }

        function coletarCessionariosAcordo(adesoes, dados, resultados, percentualDesagio, pagamentosAcordo) {
            if (!adesoes.cessionarios?.length) return;

            adesoes.cessionarios.forEach(cessaoIndex => {
                const cessao = dados.cessoes[cessaoIndex];
                if (!cessao) return;

                // Cessionários do beneficiário
                if (cessao.tipo === 'cessaobenPrincipal') {
                    adicionarCessionarioBeneficiarioAcordo(cessao, dados, resultados, percentualDesagio, pagamentosAcordo);
                }

                // Cessionários de herdeiros
                if (cessao.tipo === 'cessaoherdeiro') {
                    adicionarCessionarioHerdeiroAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
                }

                // Cessionários de advogados
                if (cessao.tipo === 'cessaoAdv') {
                    adicionarCessionarioAdvogadoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
                }

                // Cessionários de advogados sucumbenciais
                if (cessao.tipo === 'cessaoAdvSuc') {
                    adicionarCessionarioAdvSucAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
                }

                // Cessionários de sindicatos
                if (cessao.tipo === 'cessaoSind') {
                    adicionarCessionarioSindicatoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo);
                }
            });
        }

        function adicionarCessionarioBeneficiarioAcordo(cessao, dados, resultados, percentualDesagio, pagamentosAcordo) {
            if (!resultados.cessoesBeneficiarioFinais) return;
            
            const cessionarioData = resultados.cessoesBeneficiarioFinais.find(c => c.cessionario === cessao.cessionario);
            if (cessionarioData?.valorLiquido > 0) {
                pagamentosAcordo.push(
                    criarPagamentoAcordo(
                        `${cessao.cessionario} (Cess. de ${dados.beneficiario})`,
                        cessionarioData.valorBruto,
                        percentualDesagio,
                        cessionarioData.previdenciaCessao,
                        cessionarioData.irCessao,
                        resultados.rraComDesagio || resultados.rrapagamento
                    )
                );
            }
        }

        function adicionarCessionarioHerdeiroAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
            if (!resultados.temHerdeiros) return;
            
            const herdeiro = resultados.herdeiros.find(h => h.nome === cessao.cedente);
            if (herdeiro?.cessoesHerdeiro) {
                const cessionarioData = herdeiro.cessoesHerdeiro.find(c => c.cessionario === cessao.cessionario);
                if (cessionarioData?.valorLiquido > 0) {
                    pagamentosAcordo.push(
                        criarPagamentoAcordo(
                            `${cessao.cessionario} (Cess. de ${herdeiro.nome})`,
                            cessionarioData.valorBruto,
                            percentualDesagio,
                            cessionarioData.previdenciaCessao,
                            cessionarioData.irCessao,
                            herdeiro.rraComDesagio || herdeiro.rrapagamento
                        )
                    );
                }
            }
        }

        function adicionarCessionarioAdvogadoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
            // Tentar nos advogados do beneficiário
            if (resultados.honorarios) {
                const advogado = resultados.honorarios.find(adv => adv.nome === cessao.cedente);
                if (advogado?.cessionarios) {
                    const cessionarioData = advogado.cessionarios.find(c => c.nome === cessao.cessionario);
                    if (cessionarioData?.valorLiquido > 0) {
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                                cessionarioData.valorBruto,
                                percentualDesagio,
                                0,
                                cessionarioData.ir,
                                '-'
                            )
                        );
                        return;
                    }
                }
            }

            // Tentar nos advogados dos herdeiros
            if (resultados.temHerdeiros) {
                for (const herdeiro of resultados.herdeiros) {
                    if (herdeiro.honorarios) {
                        const advogado = herdeiro.honorarios.find(adv => adv.nome === cessao.cedente);
                        if (advogado?.cessionarios) {
                            const cessionarioData = advogado.cessionarios.find(c => c.nome === cessao.cessionario);
                            if (cessionarioData?.valorLiquido > 0) {
                                pagamentosAcordo.push(
                                    criarPagamentoAcordo(
                                        `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                                        cessionarioData.valorBruto,
                                        percentualDesagio,
                                        0,
                                        cessionarioData.ir,
                                        '-'
                                    )
                                );
                                return;
                            }
                        }
                    }
                }
            }
        }

        function adicionarCessionarioAdvSucAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
            if (!resultados.honorariosSucumbenciais?.honorarios) return;
            
            const advogado = resultados.honorariosSucumbenciais.honorarios.find(adv => adv.nome === cessao.cedente);
            if (advogado?.cessionarios) {
                const cessionarioData = advogado.cessionarios.find(c => c.nome === cessao.cessionario);
                if (cessionarioData?.valorLiquido > 0) {
                    pagamentosAcordo.push(
                        criarPagamentoAcordo(
                            `${cessao.cessionario} (Cess. Adv. Sucumb. ${cessao.cedente})`,
                            cessionarioData.valorBruto,
                            percentualDesagio,
                            0,
                            cessionarioData.ir,
                            '-'
                        )
                    );
                }
            }
        }

        function adicionarCessionarioSindicatoAcordo(cessao, resultados, percentualDesagio, pagamentosAcordo) {
            // Tentar nos sindicatos do beneficiário
            if (resultados.sindicatos) {
                const sindicato = resultados.sindicatos.find(sind => sind.nome === cessao.cedente);
                if (sindicato?.cessionarios) {
                    const cessionarioData = sindicato.cessionarios.find(c => c.nome === cessao.cessionario);
                    if (cessionarioData?.valorLiquido > 0) {
                        pagamentosAcordo.push(
                            criarPagamentoAcordo(
                                `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                                cessionarioData.valorBruto,
                                percentualDesagio,
                                0,
                                cessionarioData.ir,
                                '-'
                            )
                        );
                        return;
                    }
                }
            }

            // Tentar nos sindicatos dos herdeiros
            if (resultados.temHerdeiros) {
                for (const herdeiro of resultados.herdeiros) {
                    if (herdeiro.sindicatos) {
                        const sindicato = herdeiro.sindicatos.find(sind => sind.nome === cessao.cedente);
                        if (sindicato?.cessionarios) {
                            const cessionarioData = sindicato.cessionarios.find(c => c.nome === cessao.cessionario);
                            if (cessionarioData?.valorLiquido > 0) {
                                pagamentosAcordo.push(
                                    criarPagamentoAcordo(
                                        `${cessao.cessionario} (Cess. de ${cessao.cedente})`,
                                        cessionarioData.valorBruto,
                                        percentualDesagio,
                                        0,
                                        cessionarioData.ir,
                                        '-'
                                    )
                                );
                                return;
                            }
                        }
                    }
                }
            }
        }

        function adicionarPagamentosAdvogados(advogados, pagamentos, isPreferencia, entidadePai) {
            advogados.forEach(adv => {
                const devePagar = !isPreferencia || entidadePai.temPreferencia || entidadePai.isPreferenciaParcial;
                
                if (devePagar && adv.valorBrutoAdvogado > 0) {
                    pagamentos.push({
                        credor: `${adv.nome} (Advogado ${adv.tipo})`,
                        valorDevido: adv.valorBrutoAdvogado,
                        previdencia: 0,
                        ir: adv.irAdvogado || 0,
                        valorLiquido: adv.valorLiquidoAdvogado
                    });

                    // Cessionários do advogado
                    const cessionariosRecebem = !isPreferencia || 
                        (entidadePai.temPreferencia && !entidadePai.isPreferenciaParcial);
                    
                    if (cessionariosRecebem && adv.cessionarios?.length > 0) {
                        adv.cessionarios.forEach(cessionario => {
                            pagamentos.push({
                                credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                                valorDevido: cessionario.valorBruto,
                                previdencia: 0,
                                ir: cessionario.ir || 0,
                                valorLiquido: cessionario.valorLiquido
                            });
                        });
                    }
                }
            });
        }

        function adicionarPagamentosSindicatos(sindicatos, pagamentos) {
            sindicatos.forEach(sind => {
                const temCessionarios = sind.cessionarios?.length > 0;

                if (!temCessionarios && sind.valorBrutoSindicato > 0) {
                    pagamentos.push({
                        credor: `${sind.nome} (Sindicato)`,
                        valorDevido: sind.valorBrutoSindicato,
                        previdencia: 0,
                        ir: sind.irSindicato || 0,
                        valorLiquido: sind.valorLiquidoSindicato
                    });
                } else if (temCessionarios) {
                    if (sind.valorBrutoSindicato > 0) {
                        pagamentos.push({
                            credor: `${sind.nome} (Sindicato)`,
                            valorDevido: sind.valorBrutoSindicato,
                            previdencia: 0,
                            ir: sind.irSindicato || 0,
                            valorLiquido: sind.valorLiquidoSindicato
                        });
                    }

                    sind.cessionarios.forEach(cessionario => {
                        if (cessionario.valorBruto > 0) {
                            pagamentos.push({
                                credor: `${cessionario.nome} (Cessionário de ${sind.nome})`,
                                valorDevido: cessionario.valorBruto,
                                previdencia: 0,
                                ir: cessionario.ir || 0,
                                valorLiquido: cessionario.valorLiquido
                            });
                        }
                    });
                }
            });
        }

        function adicionarCessionariosBeneficiario(resultados, dados, pagamentos) {
            if (resultados.cessoesBeneficiarioFinais) {
                resultados.cessoesBeneficiarioFinais
                    .filter(cessao => cessao.valorLiquido > 0)
                    .forEach(cessao => {
                        pagamentos.push({
                            credor: `${cessao.cessionario} (Cessionário de ${dados.beneficiario})`,
                            valorDevido: cessao.valorBruto,
                            previdencia: cessao.previdenciaCessao,
                            ir: cessao.irCessao,
                            valorLiquido: cessao.valorLiquido
                        });
                    });
            }
        }

        function adicionarCessoesHerdeiro(herdeiro, pagamentos) {
            herdeiro.cessoesHerdeiro
                .filter(cessao => cessao.valorLiquido > 0)
                .forEach(cessao => {
                    pagamentos.push({
                        credor: `${cessao.cessionario} (Cessionário de ${herdeiro.nome})`,
                        valorDevido: cessao.valorBruto,
                        previdencia: cessao.previdenciaCessao,
                        ir: cessao.irCessao,
                        valorLiquido: cessao.valorLiquido
                    });
                });
        }

        function adicionarSindicatosBeneficiario(resultados, pagamentos) {
            if (resultados.sindicatos) {
                resultados.sindicatos
                    .filter(sind => {
                        const valorDevido = (sind.cessoesSind?.length > 0) 
                            ? sind.valorBrutoSindicato 
                            : sind.valorBruto;
                        return sind.podeReceber && valorDevido > 0;
                    })
                    .forEach(sind => {
                        const valorDevido = (sind.cessoesSind?.length > 0) 
                            ? sind.valorBrutoSindicato 
                            : sind.valorBruto;
                        const ir = (sind.cessoesSind?.length > 0)
                            ? sind.irSindicato
                            : sind.irSindicato || 0;

                        pagamentos.push({
                            credor: `${sind.nome} (Sindicato)`,
                            valorDevido: valorDevido,
                            previdencia: 0,
                            ir: ir,
                            valorLiquido: (sind.cessoesSind?.length > 0) 
                                ? sind.valorLiquidoSindicato 
                                : sind.valorLiquido
                        });
                    });

                // Cessionários de Sindicatos
                resultados.sindicatos.forEach(sind => {
                    if (sind.cessionarios?.length > 0 && sind.podeReceber) {
                        sind.cessionarios.forEach(cessionario => {
                            pagamentos.push({
                                credor: `${cessionario.nome} (Cessionário de ${sind.nome})`,
                                valorDevido: cessionario.valorBruto,
                                previdencia: 0,
                                ir: cessionario.ir,
                                valorLiquido: cessionario.valorLiquido
                            });
                        });
                    }
                });
            }
        }

        function adicionarAdvogadosBeneficiario(resultados, pagamentos) {
            const advogadosParaPagar = resultados.honorarios.filter(adv => 
                adv.percentualAdvogado > 0 && adv.valorBrutoAdvogado > 0
            );

            advogadosParaPagar.forEach(adv => {
                pagamentos.push({
                    credor: `${adv.nome} (Advogado ${adv.tipo})`,
                    valorDevido: adv.valorBrutoAdvogado,
                    previdencia: 0,
                    ir: adv.irAdvogado,
                    valorLiquido: adv.valorLiquidoAdvogado
                });
            });
        }

        function adicionarCessionariosAdvogadosBeneficiario(resultados, dados, pagamentos) {
            const isParcial = dados.tipoCalculo === 'parcial';

            if (isParcial) {
                resultados.honorarios.forEach(adv => {
                    if (adv.cessionarios?.length > 0) {
                        adv.cessionarios.forEach(cessionario => {
                            const honorarioParcial = resultados.valorBase * adv.percentual;
                            const valorDevido = honorarioParcial * cessionario.percentual;
                            
                            let irCorreto = 0;
                            if (adv.tipo === 'PF') {
                                irCorreto = calcularIR(valorDevido); 
                            } else {
                                irCorreto = valorDevido * 0.015;
                            }
                            
                            pagamentos.push({
                                credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                                valorDevido: valorDevido,
                                previdencia: 0,
                                ir: irCorreto,
                                valorLiquido: valorDevido - irCorreto
                            });
                        });
                    }
                });
            } else {
                resultados.honorarios.forEach(adv => {
                    if (adv.cessionarios?.length > 0) {
                        adv.cessionarios.forEach(cessionario => {
                            pagamentos.push({
                                credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                                valorDevido: cessionario.valorBruto,
                                previdencia: 0,
                                ir: cessionario.ir,
                                valorLiquido: cessionario.valorLiquido
                            });
                        });
                    }
                });
            }
        }

        function adicionarHonorariosSucumbenciaisSemHerdeiros(resultados, dados, pagamentos) {
            if (!resultados.honorariosSucumbenciais?.temHonorariosSucumbenciais || 
                !resultados.honorariosSucumbenciais?.honorarios?.length) {
                return;
            }

            const isPreferencia = dados.tipoCalculo === 'preferencia';

            resultados.honorariosSucumbenciais.honorarios.forEach(adv => {
                const { deveReceberAdvogado, deveReceberCessionarios } = verificarRecebimentoSucumbencial(adv, isPreferencia);
                
                if (deveReceberAdvogado && adv.valorBrutoAdvogado > 0) {
                    pagamentos.push({
                        credor: `${adv.nome} (Adv. Sucumbencial ${adv.tipo})`,
                        valorDevido: adv.valorBrutoAdvogado,
                        previdencia: 0,
                        ir: adv.irAdvogado || 0,
                        valorLiquido: adv.valorLiquidoAdvogado || 0
                    });
                }

                if (deveReceberCessionarios && adv.cessionarios?.length > 0) {
                    adv.cessionarios.forEach(cessionario => {
                        if (cessionario.valorLiquido > 0) {
                            pagamentos.push({
                                credor: `${cessionario.nome} (Cessionário de ${adv.nome})`,
                                valorDevido: cessionario.valorBruto,
                                previdencia: 0,
                                ir: cessionario.ir || 0,
                                valorLiquido: cessionario.valorLiquido
                            });
                        }
                    });
                }
            });
        }

        function calcularTotaisUnificado(pagamentos) {
            return {
                totalDevido: calcularTotalDevido(pagamentos),
                totalPrevidencia: calcularTotalPrevidencia(pagamentos),
                totalIR: calcularTotalIR(pagamentos),
                totalLiquido: calcularTotalLiquido(pagamentos)
            };
        }

        function gerarSecaoCessionariosBeneficiario(resultados, dados) {
            if (!resultados.cessoesBeneficiarioFinais?.length) return '';

            const cessionariosBeneficiario = resultados.cessoesBeneficiarioFinais.filter(cessao => cessao.valorLiquido > 0);
            if (cessionariosBeneficiario.length === 0) return '';

            const linhasCessionarios = cessionariosBeneficiario.map(cessao => {
                const valorDevidoArredondado = arredondarParaDuasCasas(cessao.valorBruto);
                const previdenciaArredondada = arredondarParaDuasCasas(cessao.previdenciaCessao);
                const irArredondado = arredondarParaDuasCasas(cessao.irCessao);
                const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);

                return `
                    <tr>
                        <td>${cessao.cessionario} (Cessionário de ${dados.beneficiario})</td>
                        <td>R$ ${formatarMoeda(valorDevidoArredondado)}</td>
                        <td>R$ ${formatarMoeda(previdenciaArredondada)}</td>
                        <td>R$ ${formatarMoeda(irArredondado)}</td>
                        <td>R$ ${formatarMoeda(valorLiquidoCalculado)}</td>
                    </tr>
                `;
            }).join('');

            const totalDevido = cessionariosBeneficiario.reduce((total, c) => total + arredondarParaDuasCasas(c.valorBruto), 0);
            const totalPrevidencia = cessionariosBeneficiario.reduce((total, c) => total + arredondarParaDuasCasas(c.previdenciaCessao), 0);
            const totalIR = cessionariosBeneficiario.reduce((total, c) => total + arredondarParaDuasCasas(c.irCessao), 0);
            const totalLiquido = cessionariosBeneficiario.reduce((total, c) => {
                const valorDevidoArr = arredondarParaDuasCasas(c.valorBruto);
                const previdenciaArr = arredondarParaDuasCasas(c.previdenciaCessao);
                const irArr = arredondarParaDuasCasas(c.irCessao);
                return total + arredondarParaDuasCasas(valorDevidoArr - previdenciaArr - irArr);
            }, 0);

            return `
                <div class="pagamentos-finais" style="margin-bottom: 20px;">
                    <div class="table-container">
                        <h3>📊 Cessionários do Beneficiário Principal</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Credor</th>
                                    <th>Valor Devido</th>
                                    <th>Previdência</th>
                                    <th>Imposto de Renda</th>
                                    <th>Valor Líquido</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${linhasCessionarios}
                            </tbody>
                            <tfoot>
                                <tr class="highlight">
                                    <td><strong>TOTAL CESSIONÁRIOS</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totalDevido)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totalPrevidencia)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totalIR)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totalLiquido)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }

        function montarTabelaHerdeiro(herdeiro, pagamentosHerdeiro, isPreferencia, totalHerdeiros) {
            const linhas = pagamentosHerdeiro.map(pagamento => {
                const valorDevidoArredondado = arredondarParaDuasCasas(pagamento.valorDevido);
                const previdenciaArredondada = arredondarParaDuasCasas(pagamento.previdencia);
                const irArredondado = arredondarParaDuasCasas(pagamento.ir);
                const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);

                return `
                    <tr>
                        <td>${pagamento.credor}</td>
                        <td>R$ ${formatarMoeda(valorDevidoArredondado)}</td>
                        <td>R$ ${formatarMoeda(previdenciaArredondada)}</td>
                        <td>R$ ${formatarMoeda(irArredondado)}</td>
                        <td>R$ ${formatarMoeda(valorLiquidoCalculado)}</td>
                    </tr>
                `;
            }).join('');

            const totais = calcularTotaisUnificado(pagamentosHerdeiro);
            
            const statusHerdeiro = isPreferencia 
                ? (herdeiro.isPreferenciaParcial ? ' (Preferência Parcial)' : ' (Preferência Total)') 
                : ' (Ordem Cronológica)';

            const notaTributacao = totalHerdeiros === 1 ? `
                <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                    <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nº 15.191, DE 11 DE AGOSTO DE 2025</p>
                    <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, art 714</p>
                </div>
            ` : '';

            return `
                <div class="pagamentos-finais" style="margin-bottom: 20px;">
                    <div class="table-container">
                        <h3>📊 Pagamentos - ${herdeiro.nome}${statusHerdeiro}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Credor</th>
                                    <th>Valor Devido</th>
                                    <th>Previdência</th>
                                    <th>Imposto de Renda</th>
                                    <th>Valor Líquido</th>
                                </tr>
                            </thead>
                            <tbody>${linhas}</tbody>
                            <tfoot>
                                <tr class="highlight">
                                    <td><strong>TOTAL</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        ${notaTributacao}
                    </div>
                </div>
            `;
        }

        function montarTabelaHonorariosSucumbenciais(pagamentos) {
            const linhas = pagamentos.map(pagamento => `
                <tr>
                    <td>${pagamento.credor}</td>
                    <td>R$ ${formatarMoeda(pagamento.valorDevido)}</td>
                    <td>R$ ${formatarMoeda(pagamento.previdencia)}</td>
                    <td>R$ ${formatarMoeda(pagamento.ir)}</td>
                    <td>R$ ${formatarMoeda(pagamento.valorLiquido)}</td>
                </tr>
            `).join('');

            const totais = calcularTotaisUnificado(pagamentos);

            return `
                <div class="pagamentos-finais" style="margin-bottom: 20px;">
                    <div class="table-container">
                        <h3>💼 Pagamentos - Honorários Sucumbenciais</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Credor</th>
                                    <th>Valor Devido</th>
                                    <th>Previdência</th>
                                    <th>Imposto de Renda</th>
                                    <th>Valor Líquido</th>
                                </tr>
                            </thead>
                            <tbody>${linhas}</tbody>
                            <tfoot>
                                <tr class="highlight">
                                    <td><strong>Total Honorários Sucumbenciais</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }

        function montarResumoGeral(totais) {
            return `
                <div class="pagamentos-finais" style="margin-top: 30px;">
                    <div class="table-container">
                        <h3>🎯 RESUMO GERAL DE TODOS OS PAGAMENTOS</h3>
                        <table style="background-color: #f8f9fa;">
                            <thead>
                                <tr style="background-color: #e9ecef;">
                                    <th>Total Geral</th>
                                    <th>Valor Devido</th>
                                    <th>Previdência</th>
                                    <th>Imposto de Renda</th>
                                    <th>Valor Líquido</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="highlight" style="font-weight: bold; font-size: 1.1em;">
                                    <td><strong>TOTAL FINAL</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                        <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                            <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
                            <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nº 15.191, DE 11 DE AGOSTO DE 2025</p>
                            <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, art 714</p>
                            <p style="margin: 5px 0;"><strong>Sindicatos:</strong> Tributação conforme Art. 27, da Lei nº 10.833/03 ou alíquota fixa quando aplicável</p>
                        </div>
                    </div>
                </div>
            `;
        }

        function montarTabelasAcordo(pagamentosAcordo, percentualDesagio) {
            const linhasCalculo = pagamentosAcordo.map(p => `
                <tr>
                    <td>${p.credor}</td>
                    <td>R$ ${formatarMoeda(p.valorDevido)}</td>
                    <td>R$ ${formatarMoeda(p.valorDesagio)}</td>
                    <td>R$ ${formatarMoeda(p.valorAposDesagio)}</td>
                </tr>
            `).join('');

            const linhasPagamento = pagamentosAcordo.map(p => `
                <tr>
                    <td>${p.credor}</td>
                    <td>R$ ${formatarMoeda(p.valorAposDesagio)}</td>
                    <td>R$ ${formatarMoeda(p.previdencia)}</td>
                    <td>R$ ${formatarMoeda(p.ir)}</td>
                    <td>R$ ${formatarMoeda(p.valorLiquido)}</td>
                    <td>${p.rra}</td>
                </tr>
            `).join('');

            const totais = {
                valorDevido: pagamentosAcordo.reduce((sum, p) => sum + p.valorDevido, 0),
                valorDesagio: pagamentosAcordo.reduce((sum, p) => sum + p.valorDesagio, 0),
                valorAposDesagio: pagamentosAcordo.reduce((sum, p) => sum + p.valorAposDesagio, 0),
                previdencia: pagamentosAcordo.reduce((sum, p) => sum + p.previdencia, 0),
                ir: pagamentosAcordo.reduce((sum, p) => sum + p.ir, 0),
                valorLiquido: pagamentosAcordo.reduce((sum, p) => sum + p.valorLiquido, 0)
            };

            return `
                <!-- 1ª TABELA: Cálculo do Deságio -->
                <div class="table-container">
                    <h3>📊 Cálculo do Deságio ${(percentualDesagio * 100).toFixed(2)}%</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Credor</th>
                                <th>Valor Devido</th>
                                <th>Deságio ${(percentualDesagio * 100).toFixed(2)}%</th>
                                <th>Valor Após Deságio</th>
                            </tr>
                        </thead>
                        <tbody>${linhasCalculo}</tbody>
                        <tfoot>
                            <tr class="highlight">
                                <td><strong>TOTAL</strong></td>
                                <td><strong>R$ ${formatarMoeda(totais.valorDevido)}</strong></td>
                                <td><strong>R$ ${formatarMoeda(totais.valorDesagio)}</strong></td>
                                <td><strong>R$ ${formatarMoeda(totais.valorAposDesagio)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="pagamentos-acordo">
                    <!-- 2ª TABELA: Valores Finais para Pagamento -->
                    <div class="table-container">
                        <h3>💰 Pagamento do Acordo</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Credor</th>
                                    <th>Valor Base</th>
                                    <th>Previdência</th>
                                    <th>IR</th>
                                    <th>Valor Líquido</th>
                                    <th>RRA</th>
                                </tr>
                            </thead>
                            <tbody>${linhasPagamento}</tbody>
                            <tfoot>
                                <tr class="highlight">
                                    <td><strong>TOTAL</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.valorAposDesagio)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.previdencia)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.ir)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.valorLiquido)}</strong></td>
                                    <td><strong>-</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        <div style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <h4>⚖️ Informações do Acordo:</h4>
                            <p style="margin: 5px 0;"><strong>Deságio aplicado:</strong> ${(percentualDesagio * 100).toFixed(2)}% sobre o valor devido</p>
                            <p style="margin: 5px 0;"><strong>Tributos calculados:</strong> Sobre o valor após deságio</p>
                            <p style="margin: 5px 0;"><strong>Apenas credores que aderiram</strong> ao acordo aparecem nesta tabela</p>
                        </div>
                    </div>
                </div>
            `;
        }

        function montarTabelaPagamentosSemHerdeiros(todosPagamentos, totais) {
            const linhas = todosPagamentos.map(pagamento => {
                const valorDevidoArredondado = arredondarParaDuasCasas(pagamento.valorDevido);
                const previdenciaArredondada = arredondarParaDuasCasas(pagamento.previdencia);
                const irArredondado = arredondarParaDuasCasas(pagamento.ir);
                const valorLiquidoCalculado = arredondarParaDuasCasas(valorDevidoArredondado - previdenciaArredondada - irArredondado);
                
                return `
                    <tr>
                        <td>${pagamento.credor}</td>
                        <td>R$ ${formatarMoeda(valorDevidoArredondado)}</td>
                        <td>R$ ${formatarMoeda(previdenciaArredondada)}</td>
                        <td>R$ ${formatarMoeda(irArredondado)}</td>
                        <td>R$ ${formatarMoeda(valorLiquidoCalculado)}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="pagamentos-finais">
                    <div class="table-container">
                        <h3>💰 Resumo de Pagamentos</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Credor</th>
                                    <th>Valor Devido</th>
                                    <th>Previdência</th>
                                    <th>Imposto de Renda</th>
                                    <th>Valor Líquido</th>
                                </tr>
                            </thead>
                            <tbody>${linhas}</tbody>
                            <tfoot>
                                <tr class="highlight">
                                    <td><strong>TOTAL</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalDevido)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalPrevidencia)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalIR)}</strong></td>
                                    <td><strong>R$ ${formatarMoeda(totais.totalLiquido)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                            <h4>📋 Notas sobre Tributação do Imposto de Renda:</h4>
                            <p style="margin: 5px 0;"><strong>Advogados Pessoa Física (PF):</strong> 🏦 LEI Nº 15.191, DE 11 DE AGOSTO DE 2025</p>
                            <p style="margin: 5px 0;"><strong>Advogados Pessoa Jurídica (PJ):</strong> 🏦 DECRETO 9.580, art 714</p>
                            <p style="margin: 5px 0;"><strong>Sindicatos:</strong> Tributação conforme Art. 27, da Lei nº 10.833/03 ou alíquota fixa quando aplicável</p>
                        </div>
                    </div>
                </div>
            `;
        }

        function gerarSecaoNotasExplicativas() {
            return `
                <div class="notas-explicativas">
                    <h3>📝 Notas Explicativas do Cálculo</h3>
                    <textarea id="notasExplicativas" class="textarea-notas" placeholder="Digite aqui as notas explicativas sobre os critérios utilizados no cálculo, fundamentação legal, decisões judiciais aplicadas, metodologia de atualização monetária, etc. Exemplo: 1- Destaque do crédito preferencial, conforme decisão de id... 2- Atualização do Cálculo do id..." maxlength="5000"></textarea>
                </div>
            `;
        }

        function obterNotasExplicativas() {
            const textarea = document.getElementById('notasExplicativas');
            return textarea ? textarea.value.trim() : '';
        }

        function prepararTextareaParaImpressao() {
            // Primeiro, remove qualquer elemento anterior
            const elementoAnterior = document.getElementById('notasParaImpressao');
            if (elementoAnterior) {
                elementoAnterior.remove();
            }
            
            const textarea = document.getElementById('notasExplicativas');
            if (textarea && textarea.value.trim()) {
                // Na impressão
                const notasDiv = document.createElement('div');
                notasDiv.id = 'notasParaImpressao';
                notasDiv.style.display = 'none';
                notasDiv.innerHTML = `
                    <div class="notas-explicativas-impressao">
                        <h3>📝 Notas Explicativas do Cálculo</h3>
                        <div class="conteudo-notas">${textarea.value}</div>
                    </div>
                `;
                
                // Inserir antes do botão de imprimir
                const botao = document.querySelector('.print-button-container');
                if (botao) {
                    botao.parentNode.insertBefore(notasDiv, botao);
                }
            }
        }

        function limparNotasExplicativas() {
            const textarea = document.getElementById('notasExplicativas');
            if (textarea) {
                textarea.value = '';
            }
        }
        
        function gerarBotaoImprimir() {
            return `
                <div class="print-button-container" style="text-align: center; margin: 20px 0; display: block;">
                    <button onclick="prepararTextareaParaImpressao(); window.print();" style="
                        background-color: #343A40;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        font-size: 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        transition: background-color 0.3s;
                    " onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#343A40'">
                        🖨️ Imprimir / Salvar PDF
                    </button>
                </div>
            `;
        }
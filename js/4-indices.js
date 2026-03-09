// ====================================
// ÍNDICES - CNJ, SELIC, IPCA-E, IPCA, Juros 2%
// ====================================

const meses = {
            "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4,
            "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
            "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
        };

// Índices CNJ
const indicesCNJ = {
    // 1968-1969
    "julho-1968":2.3766255,"agosto-1968":2.3244716,"setembro-1968":2.2827271,"outubro-1968":2.25106,"novembro-1968":2.217677,"dezembro-1968":2.1821434,
    "janeiro-1969":2.1410981,"fevereiro-1969":2.1027271,"março-1969":2.066267,"abril-1969":2.0375611,"maio-1969":2.0064697,"junho-1969":1.9819624,
    "julho-1969":1.9555362,"agosto-1969":1.942091,"setembro-1969":1.9278542,"outubro-1969":1.9104688,"novembro-1969":1.8798598,"dezembro-1969":1.8412823,
    
    // 1970-1971
    "janeiro-1970":1.800848,"fevereiro-1970":1.7613375,"março-1970":1.7266451,"abril-1970":1.7073184,"maio-1970":1.6917904,"junho-1970":1.6761739,
    "julho-1970":1.6507773,"agosto-1970":1.6362565,"setembro-1970":1.6209546,"outubro-1970":1.6018885,"novembro-1970":1.5721689,"dezembro-1970":1.5394815,
    "janeiro-1971":1.5099171,"fevereiro-1971":1.4826188,"março-1971":1.4632754,"abril-1971":1.4488205,"maio-1971":1.4322237,"junho-1971":1.4120702,
    "julho-1971":1.3846389,"agosto-1971":1.3575278,"setembro-1971":1.329601,"outubro-1971":1.301244,"novembro-1971":1.275563,"dezembro-1971":1.2549928,
    
    // 1972-1973
    "janeiro-1972":1.239693,"fevereiro-1972":1.2249585,"março-1972":1.2088431,"abril-1972":1.1952032,"maio-1972":1.1794914,"junho-1972":1.1599378,
    "julho-1972":1.1394877,"agosto-1972":1.1233748,"setembro-1972":1.1140215,"outubro-1972":1.1061046,"novembro-1972":1.0956172,"dezembro-1972":1.0884246,
    "janeiro-1973":1.0761382,"fevereiro-1973":1.0656129,"março-1973":1.0545619,"abril-1973":1.0420264,"maio-1973":1.0302028,"junho-1973":1.0172858,
    "julho-1973":1.0061466,"agosto-1973":0.9972007,"setembro-1973":0.9889252,"outubro-1973":0.9794005,"novembro-1973":0.9727795,"dezembro-1973":0.9645367,
    
    // 1974-1975
    "janeiro-1974":0.9459925,"fevereiro-1974":0.9361227,"março-1974":0.9223112,"abril-1974":0.9108553,"maio-1974":0.8961917,"junho-1974":0.8775275,
    "julho-1974":0.8492863,"agosto-1974":0.8135031,"setembro-1974":0.7764805,"outubro-1974":0.7484388,"novembro-1974":0.7326216,"dezembro-1974":0.7235169,
    "janeiro-1975":0.7143679,"fevereiro-1975":0.7036899,"março-1975":0.6921938,"abril-1975":0.6794291,"maio-1975":0.666136,"junho-1975":0.6511219,
    "julho-1975":0.6394392,"agosto-1975":0.6286861,"setembro-1975":0.6190415,"outubro-1975":0.6067296,"novembro-1975":0.5938325,"dezembro-1975":0.5824938,
    
    // 1976-1977
    "janeiro-1976":0.5719658,"fevereiro-1976":0.5611914,"março-1976":0.5489126,"abril-1976":0.5361777,"maio-1976":0.5229782,"junho-1976":0.5078638,
    "julho-1976":0.4933112,"agosto-1976":0.4810212,"setembro-1976":0.4679752,"outubro-1976":0.4530738,"novembro-1976":0.4373045,"dezembro-1976":0.4244541,
    "janeiro-1977":0.4152786,"fevereiro-1977":0.4082102,"março-1977":0.400325,"abril-1977":0.3914485,"maio-1977":0.3804735,"junho-1977":0.3686124,
    "julho-1977":0.3567162,"agosto-1977":0.3474371,"setembro-1977":0.3404576,"outubro-1977":0.3357513,"novembro-1977":0.331159,"dezembro-1977":0.3262852,
    
    // 1978-1979
    "janeiro-1978":0.3200147,"fevereiro-1978":0.3134001,"março-1978":0.3063011,"abril-1978":0.2986019,"maio-1978":0.2901279,"junho-1978":0.2815487,
    "julho-1978":0.2733153,"agosto-1978":0.2651989,"setembro-1978":0.25803,"outubro-1978":0.251462,"novembro-1978":0.2456308,"dezembro-1978":0.2394985,
    "janeiro-1979":0.2333575,"fevereiro-1979":0.2282044,"março-1979":0.2230193,"abril-1979":0.2175856,"maio-1979":0.2097292,"junho-1979":0.2020075,
    "julho-1979":0.1955035,"agosto-1979":0.190327,"setembro-1979":0.1850037,"outubro-1979":0.1778589,"novembro-1979":0.170058,"dezembro-1979":0.1627145,
    
    // 1980-1981
    "janeiro-1980":0.1563371,"fevereiro-1980":0.1500323,"março-1980":0.1446787,"abril-1980":0.1395176,"maio-1980":0.134541,"junho-1980":0.1301177,
    "julho-1980":0.1260823,"agosto-1980":0.1221721,"setembro-1980":0.1183831,"outubro-1980":0.1149345,"novembro-1980":0.1113712,"dezembro-1980":0.1079184,
    "janeiro-1981":0.1032714,"fevereiro-1981":0.0983531,"março-1981":0.0923506,"abril-1981":0.0868771,"maio-1981":0.0819597,"junho-1981":0.0773206,
    "julho-1981":0.072944,"agosto-1981":0.0688153,"setembro-1981":0.0650428,"outubro-1981":0.061535,"novembro-1981":0.0582165,"dezembro-1981":0.0551816,
    
    // 1982-1983
    "janeiro-1982":0.0524539,"fevereiro-1982":0.0499561,"março-1982":0.0475773,"abril-1982":0.0453117,"maio-1982":0.0429495,"junho-1982":0.0407105,
    "julho-1982":0.0385881,"agosto-1982":0.036404,"setembro-1982":0.0340224,"outubro-1982":0.0317967,"novembro-1982":0.0297165,"dezembro-1982":0.0279028,
    "janeiro-1983":0.0261998,"fevereiro-1983":0.0247168,"março-1983":0.0231648,"abril-1983":0.0212521,"maio-1983":0.0194973,"junho-1983":0.0180531,
    "julho-1983":0.0167468,"agosto-1983":0.0153641,"setembro-1983":0.0141604,"outubro-1983":0.0129319,"novembro-1983":0.0117884,"dezembro-1983":0.0108749,
    
    // 1984-1985
    "janeiro-1984":0.0101068,"fevereiro-1984":0.0092048,"março-1984":0.0081966,"abril-1984":0.0074514,"maio-1984":0.0068425,"junho-1984":0.0062832,
    "julho-1984":0.0057539,"agosto-1984":0.0052166,"setembro-1984":0.0047166,"outubro-1984":0.0042684,"novembro-1984":0.0037908,"dezembro-1984":0.0034493,
    "janeiro-1985":0.0031216,"fevereiro-1985":0.0027722,"março-1985":0.0025157,"abril-1985":0.0022322,"maio-1985":0.001996,"junho-1985":0.0018145,
    "julho-1985":0.0016615,"agosto-1985":0.0015439,"setembro-1985":0.0014272,"outubro-1985":0.0013082,"novembro-1985":0.0012001,"dezembro-1985":0.00108,
    
    // 1986-1987
    "janeiro-1986":0.0009528,"fevereiro-1986":0.0008197,"março-1986":0.7167849,"abril-1986":0.7175942,"maio-1986":0.7120335,"junho-1986":0.7021997,
    "julho-1986":0.6933895,"agosto-1986":0.6852283,"setembro-1986":0.6739057,"outubro-1986":0.6624906,"novembro-1986":0.6501229,"dezembro-1986":0.6294125,
    "janeiro-1987":0.5867511,"fevereiro-1987":0.5022781,"março-1987":0.4199434,"abril-1987":0.3667159,"maio-1987":0.3031719,"junho-1987":0.2455992,
    "julho-1987":0.2080982,"agosto-1987":0.201938,"setembro-1987":0.1898626,"outubro-1987":0.1796563,"novembro-1987":0.1645506,"dezembro-1987":0.1458267,
    
    // 1988-1989
    "janeiro-1988":0.1277614,"fevereiro-1988":0.1096562,"março-1988":0.0929596,"abril-1988":0.0801306,"maio-1988":0.0671787,"junho-1988":0.0570374,
    "julho-1988":0.0477181,"agosto-1988":0.03847,"setembro-1988":0.0318829,"outubro-1988":0.02571,"novembro-1988":0.0202043,"dezembro-1988":0.0159189,
    "janeiro-1989":12.3603833,"fevereiro-1989":8.6605825,"março-1989":7.863249,"abril-1989":7.4118151,"maio-1989":6.9071782,"junho-1989":6.2828366,
    "julho-1989":5.0329457,"agosto-1989":3.9086105,"setembro-1989":3.0220826,"outubro-1989":2.2229176,"novembro-1989":1.6152449,"dezembro-1989":1.1421578,
    
    // 1990-1991
    "janeiro-1990":0.7438344,"fevereiro-1990":0.4764825,"março-1990":0.2757736,"abril-1990":0.1496168,"maio-1990":0.1033265,"junho-1990":0.095788,
    "julho-1990":0.0874377,"agosto-1990":0.0774333,"setembro-1990":0.0691184,"outubro-1990":0.0612969,"novembro-1990":0.053675,"dezembro-1990":0.0464397,
    "janeiro-1991":0.0392559,"fevereiro-1991":0.0327378,"março-1991":0.0268629,"abril-1991":0.0240298,"maio-1991":0.0228833,"junho-1991":0.0214504,
    "julho-1991":0.0193544,"agosto-1991":0.0172591,"setembro-1991":0.0149274,"outubro-1991":0.0129108,"novembro-1991":0.010663,"dezembro-1991":0.0084306,
    
    // 1992-1993
    "janeiro-1992":0.0068,"fevereiro-1992":0.005414,"março-1992":0.0042934,"abril-1992":0.0035183,"maio-1992":0.0029361,"junho-1992":0.0023784,
    "julho-1992":0.0019294,"agosto-1992":0.0015944,"setembro-1992":0.0012948,"outubro-1992":0.0010499,"novembro-1992":0.0008367,"dezembro-1992":0.0006764,
    "janeiro-1993":0.0005477,"fevereiro-1993":0.000423,"março-1993":0.0003338,"abril-1993":0.000265,"maio-1993":0.0002081,"junho-1993":0.0001616,
    "julho-1993":0.000124,"agosto-1993":0.0948816,"setembro-1993":0.0718836,"outubro-1993":0.0534912,"novembro-1993":0.0395748,"dezembro-1993":0.0295551,
    
    // 1994-1995
    "janeiro-1994":0.0216221,"fevereiro-1994":0.0155364,"março-1994":0.0111214,"abril-1994":0.007743,"maio-1994":0.0054818,"junho-1994":0.0038013,
    "julho-1994":7.2267421,"agosto-1994":6.8685226,"setembro-1994":6.5409759,"outubro-1994":6.4362456,"novembro-1994":6.3160917,"dezembro-1994":6.1347593,
    "janeiro-1995":5.9996804,"fevereiro-1995":5.9996804,"março-1995":5.9996804,"abril-1995":5.7498707,"maio-1995":5.7498707,"junho-1995":5.7498707,
    "julho-1995":5.3675089,"agosto-1995":5.3675089,"setembro-1995":5.3675089,"outubro-1995":5.1056133,"novembro-1995":5.1056133,"dezembro-1995":5.1056133,
    
    // 1996-1997
    "janeiro-1996":4.8992201,"fevereiro-1996":4.8992201,"março-1996":4.8992201,"abril-1996":4.8992201,"maio-1996":4.8992201,"junho-1996":4.8992201,
    "julho-1996":4.5891079,"agosto-1996":4.5891079,"setembro-1996":4.5891079,"outubro-1996":4.5891079,"novembro-1996":4.5891079,"dezembro-1996":4.5891079,
    "janeiro-1997":4.4576018,"fevereiro-1997":4.4576018,"março-1997":4.4576018,"abril-1997":4.4576018,"maio-1997":4.4576018,"junho-1997":4.4576018,
    "julho-1997":4.4576018,"agosto-1997":4.4576018,"setembro-1997":4.4576018,"outubro-1997":4.4576018,"novembro-1997":4.4576018,"dezembro-1997":4.4576018,
    
    // 1998-1999
    "janeiro-1998":4.2243094,"fevereiro-1998":4.2243094,"março-1998":4.2243094,"abril-1998":4.2243094,"maio-1998":4.2243094,"junho-1998":4.2243094,
    "julho-1998":4.2243094,"agosto-1998":4.2243094,"setembro-1998":4.2243094,"outubro-1998":4.2243094,"novembro-1998":4.2243094,"dezembro-1998":4.2243094,
    "janeiro-1999":4.1555616,"fevereiro-1999":4.1555616,"março-1999":4.1555616,"abril-1999":4.1555616,"maio-1999":4.1555616,"junho-1999":4.1555616,
    "julho-1999":4.1555616,"agosto-1999":4.1555616,"setembro-1999":4.1555616,"outubro-1999":4.1555616,"novembro-1999":4.1555616,"dezembro-1999":4.1555616,
    
    // 2000-2001
    "janeiro-2000":3.8154156,"fevereiro-2000":3.8154156,"março-2000":3.8154156,"abril-2000":3.8154156,"maio-2000":3.8154156,"junho-2000":3.8154156,
    "julho-2000":3.8154156,"agosto-2000":3.8154156,"setembro-2000":3.8154156,"outubro-2000":3.8154156,"novembro-2000":3.8154156,"dezembro-2000":3.8154156,
    "janeiro-2001":3.5982417,"fevereiro-2001":3.5757147,"março-2001":3.557925,"abril-2001":3.5451624,"maio-2001":3.5275248,"junho-2001":3.5103242,
    "julho-2001":3.4970355,"agosto-2001":3.4644695,"setembro-2001":3.4240655,"outubro-2001":3.4111033,"novembro-2001":3.3985288,"dezembro-2001":3.3652132,
    
    // 2002-2003
    "janeiro-2002":3.3468057,"fevereiro-2002":3.3261834,"março-2002":3.3116123,"abril-2002":3.2984186,"maio-2002":3.2728901,"junho-2002":3.2592014,
    "julho-2002":3.2484814,"agosto-2002":3.2236593,"setembro-2002":3.1917418,"outubro-2002":3.172075,"novembro-2002":3.1437809,"dezembro-2002":3.0797227,
    "janeiro-2003":2.9885713,"fevereiro-2003":2.9305465,"março-2003":2.8677429,"abril-2003":2.8354191,"maio-2003":2.8034597,"junho-2003":2.7798311,
    "julho-2003":2.7737289,"agosto-2003":2.7787306,"setembro-2003":2.7712483,"outubro-2003":2.7555417,"novembro-2003":2.7374743,"dezembro-2003":2.7328285,
    
    // 2004-2005
    "janeiro-2004":2.7203151,"fevereiro-2004":2.7019419,"março-2004":2.6778413,"abril-2004":2.6671726,"maio-2004":2.6615833,"junho-2004":2.6472879,
    "julho-2004":2.6325457,"agosto-2004":2.6082886,"setembro-2004":2.5878446,"outubro-2004":2.575226,"novembro-2004":2.5670116,"dezembro-2004":2.5509407,
    "janeiro-2005":2.5296912,"fevereiro-2005":2.5126055,"março-2005":2.4941488,"abril-2005":2.4854498,"maio-2005":2.4671925,"junho-2005":2.4468834,
    "julho-2005":2.4439507,"agosto-2005":2.4412653,"setembro-2005":2.4344488,"outubro-2005":2.4305599,"novembro-2005":2.4170246,"dezembro-2005":2.3983177,
    
    // 2006-2007
    "janeiro-2006":2.3892386,"fevereiro-2006":2.3771153,"março-2006":2.3648182,"abril-2006":2.3561007,"maio-2006":2.3521021,"junho-2006":2.3457685,
    "julho-2006":2.3492925,"agosto-2006":2.3497624,"setembro-2006":2.3453063,"outubro-2006":2.3441343,"novembro-2006":2.3373559,"dezembro-2006":2.3287396,
    "janeiro-2007":2.3206174,"fevereiro-2007":2.3086127,"março-2007":2.2980417,"abril-2007":2.2886582,"maio-2007":2.2836342,"junho-2007":2.2777121,
    "julho-2007":2.2711259,"agosto-2007":2.2656882,"setembro-2007":2.2562121,"outubro-2007":2.249688,"novembro-2007":2.2443017,"dezembro-2007":2.2391516,
    
    // 2008-2009
    "janeiro-2008":2.2235865,"fevereiro-2008":2.2081296,"março-2008":2.1940875,"abril-2008":2.1890526,"maio-2008":2.176213,"junho-2008":2.1640941,
    "julho-2008":2.1447909,"agosto-2008":2.1313634,"setembro-2008":2.1239296,"outubro-2008":2.1184217,"novembro-2008":2.1120854,"dezembro-2008":2.1017867,
    "janeiro-2009":2.0957091,"fevereiro-2009":2.0873597,"março-2009":2.0742917,"abril-2009":2.0720124,"maio-2009":2.06458,"junho-2009":2.0524704,
    "julho-2009":2.0447005,"agosto-2009":2.0402121,"setembro-2009":2.0355303,"outubro-2009":2.0316702,"novembro-2009":2.0280197,"dezembro-2009":2.0191355,
    
    // 2010-2011
    "janeiro-2010":2.0114919,"fevereiro-2010":2.0010862,"março-2010":1.9824512,"abril-2010":1.9716073,"maio-2010":1.9621888,"junho-2010":1.9499044,
    "julho-2010":1.9462066,"agosto-2010":1.9479598,"setembro-2010":1.9489343,"outubro-2010":1.9429112,"novembro-2010":1.9309394,"dezembro-2010":1.9144749,
    "janeiro-2011":1.9013556,"fevereiro-2011":1.8870143,"março-2011":1.8688861,"abril-2011":1.8577396,"maio-2011":1.8435443,"junho-2011":1.8307292,
    "julho-2011":1.8265282,"agosto-2011":1.8247035,"setembro-2011":1.8197901,"outubro-2011":1.8101961,"novembro-2011":1.802625,"dezembro-2011":1.7943709,
    
    // 2012-2013
    "janeiro-2012":1.7843784,"fevereiro-2012":1.7728548,"março-2012":1.7635083,"abril-2012":1.7591105,"maio-2012":1.7515787,"junho-2012":1.742691,
    "julho-2012":1.7395598,"agosto-2012":1.7338381,"setembro-2012":1.7271024,"outubro-2012":1.7188519,"novembro-2012":1.7077515,"dezembro-2012":1.6985792,
    "janeiro-2013":1.6869393,"fevereiro-2013":1.6722237,"março-2013":1.6609294,"abril-2013":1.6528305,"maio-2013":1.6444439,"junho-2013":1.6369141,
    "julho-2013":1.6307174,"agosto-2013":1.6295766,"setembro-2013":1.6269735,"outubro-2013":1.6225925,"novembro-2013":1.6148413,"dezembro-2013":1.6056888,
    
    // 2014-2015
    "janeiro-2014":1.5937358,"fevereiro-2014":1.5831288,"março-2014":1.572124,"abril-2014":1.5607306,"maio-2014":1.5486512,"junho-2014":1.5397208,
    "julho-2014":1.532518,"agosto-2014":1.5299171,"setembro-2014":1.5277782,"outubro-2014":1.521843,"novembro-2014":1.5145731,"dezembro-2014":1.5088395,
    "janeiro-2015":1.4970131,"fevereiro-2015":1.4838072,"março-2015":1.4643316,"abril-2015":1.4463963,"maio-2015":1.4310837,"junho-2015":1.4225484,
    "julho-2015":1.4086032,"agosto-2015":1.4003412,"setembro-2015":1.3943455,"outubro-2015":1.3889287,"novembro-2015":1.3798219,"dezembro-2015":1.3681922,
    
    // 2016-2017
    "janeiro-2016":1.3522358,"fevereiro-2016":1.3399087,"março-2016":1.3211484,"abril-2016":1.3154918,"maio-2016":1.3088168,"junho-2016":1.2976569,
    "julho-2016":1.292487,"agosto-2016":1.2855451,"setembro-2016":1.279786,"outubro-2016":1.2768493,"novembro-2016":1.2744279,"dezembro-2016":1.2711229,
    "janeiro-2017":1.2687124,"fevereiro-2017":1.2647915,"março-2017":1.2579983,"abril-2017":1.2561142,"maio-2017":1.2534819,"junho-2017":1.2504807,
    "julho-2017":1.2484831,"agosto-2017":1.2507344,"setembro-2017":1.2463721,"outubro-2017":1.2450026,"novembro-2017":1.240784,"dezembro-2017":1.2368261,
    
    // 2018-2019
    "janeiro-2018":1.2325123,"fevereiro-2018":1.2277242,"março-2018":1.2230765,"abril-2018":1.2218547,"maio-2018":1.2192942,"junho-2018":1.2175895,
    "julho-2018":1.2042227,"agosto-2018":1.1965646,"setembro-2018":1.1950111,"outubro-2018":1.1939366,"novembro-2018":1.1870517,"dezembro-2018":1.1848006,
    "janeiro-2019":1.1866993,"fevereiro-2019":1.1831498,"março-2019":1.1791408,"abril-2019":1.1728076,"maio-2019":1.1644237,"junho-2019":1.1603625,
    "julho-2019":1.1596667,"agosto-2019":1.1586239,"setembro-2019":1.1576978,"outubro-2019":1.1566568,"novembro-2019":1.1556167,"dezembro-2019":1.1540011,
    
    // 2020-2021
    "janeiro-2020":1.14201,"fevereiro-2020":1.1339589,"março-2020":1.1314697,"abril-2020":1.1312434,"maio-2020":1.1313565,"junho-2020":1.1380712,
    "julho-2020":1.1378436,"agosto-2020":1.1344403,"setembro-2020":1.1318371,"outubro-2020":1.1267666,"novembro-2020":1.1162736,"dezembro-2020":1.1073045,
    "janeiro-2021":1.0956901,"fevereiro-2021":1.0872099,"março-2021":1.0820162,"abril-2021":1.0720462,"maio-2021":1.0656523,"junho-2021":1.060984,
    "julho-2021":1.0522503,"agosto-2021":1.0447282,"setembro-2021":1.0355122,"outubro-2021":1.0238404,"novembro-2021":1.0117,"dezembro-2021":1
};

function obterIndiceCNJ(mesBase, anoBase) {
    const numeroMesBase = meses[mesBase.toLowerCase()];
    // Se o período base é após dezembro de 2021, não há correção
    if (anoBase > 2021 || (anoBase === 2021 && numeroMesBase > 12)) {
        return 1.0000;
    }
    
    const chave = `${mesBase.toLowerCase()}-${anoBase}`;
    return indicesCNJ[chave] || 1.0000;
}

// ====================================
// Juros de mora (Card. Poupança)
// ====================================

const periodosJuros = [
    [10, 1964, 12, 2002, 0.5, 0.5],
    [1, 2003, 6, 2009, 0.5, 1.0],
    [7, 2009, 5, 2012, 0.5, 0.5],
    [6, 2012, 6, 2012, 0.4828, 0.4828],
    [7, 2012, 7, 2012, 0.4973, 0.4973],
    [8, 2012, 8, 2012, 0.4675, 0.4675],
    [9, 2012, 10, 2012, 0.4273, 0.4273],
    [11, 2012, 4, 2013, 0.4134, 0.4134],
    [5, 2013, 5, 2013, 0.4273, 0.4273],
    [6, 2013, 6, 2013, 0.4551, 0.4551],
    [7, 2013, 7, 2013, 0.4761, 0.4761],
    [8, 2013, 8, 2013, 0.4828, 0.4828],
    [9, 2013, 9, 2017, 0.5, 0.5],
    [10, 2017, 10, 2017, 0.4690, 0.4690],
    [11, 2017, 12, 2017, 0.4273, 0.4273],
    [1, 2018, 2, 2018, 0.3994, 0.3994],
    [3, 2018, 3, 2018, 0.3855, 0.3855],
    [4, 2018, 7, 2019, 0.3715, 0.3715],
    [8, 2019, 9, 2019, 0.3434, 0.3434],
    [10, 2019, 10, 2019, 0.3153, 0.3153],
    [11, 2019, 12, 2019, 0.2871, 0.2871],
    [1, 2020, 2, 2020, 0.2588, 0.2588],
    [3, 2020, 3, 2020, 0.2446, 0.2446],
    [4, 2020, 5, 2020, 0.2162, 0.2162],
    [6, 2020, 6, 2020, 0.1733, 0.1733],
    [7, 2020, 8, 2020, 0.1303, 0.1303],
    [9, 2020, 3, 2021, 0.1159, 0.1159],
    [4, 2021, 5, 2021, 0.1590, 0.1590],
    [6, 2021, 6, 2021, 0.2019, 0.2019],
    [7, 2021, 8, 2021, 0.2446, 0.2446],
    [9, 2021, 9, 2021, 0.3012, 0.3012],
    [10, 2021, 10, 2021, 0.3575, 0.3575],
    [11, 2021, 11, 2021, 0.4412, 0.4412]
];

function calcularPeriodoGraca(anoOrcamento) {
    let inicioGraca;
    if (anoOrcamento <= 2022) {
        // Julho do ano anterior
        inicioGraca = new Date(anoOrcamento - 1, 6, 1); // Julho
    } else if (anoOrcamento >= 2023 && anoOrcamento <= 2026) {
        // Abril do ano anterior
        inicioGraca = new Date(anoOrcamento - 1, 3, 1); // Abril
    } else { // anoOrcamento >= 2027
        // Fevereiro do ano anterior
        inicioGraca = new Date(anoOrcamento - 1, 1, 1); // Fevereiro
    }
    const fimGraca = new Date(anoOrcamento, 11, 31);
    return { inicioGraca, fimGraca };
}

function criarDataBase(mesBase, anoBase) {
    const numeroMes = meses[mesBase.toLowerCase()];
    return new Date(anoBase, numeroMes - 1, 1);
}

function obterTaxaJuros(mes, ano, natureza) {
    const dataConsulta = new Date(ano, mes - 1, 1);
    for (const periodo of periodosJuros) {
        const [mesInicio, anoInicio, mesFim, anoFim, juroAlimentar, juroComum] = periodo;
        const dataInicio = new Date(anoInicio, mesInicio - 1, 1);
        const dataFim = new Date(anoFim, mesFim - 1, 1);
        if (dataConsulta >= dataInicio && dataConsulta <= dataFim) {
            return natureza === 'alimentar' ? juroAlimentar : juroComum;
        }
    }
    return 0;
}

function estaNoPeriodoGraca(data, inicioGraca, fimGraca) {
    return data >= inicioGraca && data <= fimGraca;
}

function gerarMesesEntreDatas(dataInicio, dataFim) {
    const meses = [];
    const atual = new Date(dataInicio);
    while (atual <= dataFim) {
        meses.push({
            mes: atual.getMonth() + 1,
            ano: atual.getFullYear(),
            data: new Date(atual)
        });
        atual.setMonth(atual.getMonth() + 1);
    }
    return meses;
}

function calcularSomaJurosMora(mesBase, anoBase, natureza, inicioGraca = null, fimGraca = null) {
    const dataBase = criarDataBase(mesBase, anoBase);
    const dataLimite = new Date(2021, 10, 1); // Novembro/2021 (mês 10)
    if (dataBase > dataLimite) {
        return 0; // Fora do período, sem juros
    }
    const mesesCalculo = gerarMesesEntreDatas(dataBase, dataLimite);
    let somaJuros = 0;
    for (const mesInfo of mesesCalculo) {
        const { mes, ano, data } = mesInfo;
        const estaGraca = inicioGraca && fimGraca && estaNoPeriodoGraca(data, inicioGraca, fimGraca);
        if (estaGraca) continue;
        const taxa = obterTaxaJuros(mes, ano, natureza);
        somaJuros += taxa;
    }
    return somaJuros;
}

// ====================================
// Selic
// ====================================


async function calcularSelic(dataBase, inicioGraca, fimGraca) {
    try {
        // Descobre a data final como o último dia do mês anterior ao mês atual
        const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
        const [ano, mes, dia] = dataAtualizacaoInput.split('-');
        const dataReferencia = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

        const primeiroDiaMesAtual = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
        const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual - 1);
        
        // ⚠️ LIMITAR até 31/07/2025 para SELIC antiga
        const dataLimite31Jul2025 = new Date(2025, 6, 31);
        const dataFinalSelic = ultimoDiaMesAnterior < dataLimite31Jul2025 ? ultimoDiaMesAnterior : dataLimite31Jul2025;
        
        const dataFinal = dataFinalSelic.toLocaleDateString('pt-BR');
        
        const urlselic = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=01/12/2021&dataFinal=${dataFinal}`;
        
        const response = await fetch(urlselic);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const dadosselic = await response.json();
        
        return processarDadosSelic(dadosselic, dataBase, inicioGraca, fimGraca);
        
    } catch (error) {
        console.error(`Erro ao obter dados da SELIC: ${error}`);
    }
}

function processarDadosSelic(dadosselic, dataBase, inicioGraca, fimGraca) {
    function strParaData(dataStr) {
        const [dia, mes, ano] = dataStr.split('/');
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }
    
    // Aplica SELIC antes do início da graça
    let selicAntesGraca = [];
    let periodoAntesGraca = '';
    if (dataBase < inicioGraca) {
        const dadosAntesGraca = dadosselic.filter(item => {
            const dataItem = strParaData(item.data);
            return dataBase <= dataItem && dataItem < inicioGraca;
        });
        selicAntesGraca = dadosAntesGraca.map(item => parseFloat(item.valor.replace(',', '.')));
        
        // Definir período antes da graça
        if (dadosAntesGraca.length > 0) {
            const primeiraData = dadosAntesGraca[0].data;
            const ultimaData = dadosAntesGraca[dadosAntesGraca.length - 1].data;
            periodoAntesGraca = `${primeiraData} a ${ultimaData}`;
        }
    }
    
    let dadosAposGraca = [];
    if (dataBase > fimGraca) {
        // Se dataBase é após a graça, aplica SELIC da dataBase até hoje
        dadosAposGraca = dadosselic.filter(item => {
            const dataItem = strParaData(item.data);
            return dataItem >= dataBase;
        });
    } else {
        // Se dataBase é antes/durante a graça, aplica SELIC após a graça até hoje
        dadosAposGraca = dadosselic.filter(item => {
            const dataItem = strParaData(item.data);
            return dataItem > fimGraca;
        });
    }
    
    const selicAposGraca = dadosAposGraca.map(item => parseFloat(item.valor.replace(',', '.')));
    
    // Definir período após a graça
    let periodoAposGraca = '';
    if (dadosAposGraca.length > 0) {
        const primeiraData = dadosAposGraca[0].data;
        const ultimaData = dadosAposGraca[dadosAposGraca.length - 1].data;
        periodoAposGraca = `${primeiraData} a ${ultimaData}`;
    }
    
    // Soma da SELIC
    const somaSelicAntes = selicAntesGraca.reduce((sum, val) => sum + val, 0);
    const somaSelicApos = selicAposGraca.reduce((sum, val) => sum + val, 0);
    const somaSelic = somaSelicAntes + somaSelicApos;
    const indiceselic = 1 + (somaSelic / 100);
    const indiceSelicAntes = somaSelicAntes > 0 ? 1 + (somaSelicAntes / 100) : 1.0;
    const indiceSelicApos = somaSelicApos > 0 ? 1 + (somaSelicApos / 100) : 1.0;
    
    return {
        indiceselic,
        indiceSelicAntes,
        indiceSelicApos,
        periodoAntesGraca,
        periodoAposGraca,
        temSelicAntes: selicAntesGraca.length > 0,
        temSelicApos: selicAposGraca.length > 0
    };
}

// ====================================
// IPCA-E
// ====================================

async function calcularIpcaE(dataBase, inicioGraca, fimGraca) {
    try {
        // Descobre a data final como o último dia do mês anterior ao mês atual
        const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
        const [ano, mes, dia] = dataAtualizacaoInput.split('-');
        const dataReferencia = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

        const primeiroDiaMesAtual = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
        const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual - 1);
        const dataFinal = ultimoDiaMesAnterior.toLocaleDateString('pt-BR');
        const urlipcae = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.10764/dados?formato=json&dataInicial=01/12/2021&dataFinal=${dataFinal}`;
        //10764 - IPCA.E
        const response = await fetch(urlipcae);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const dadosipcae = await response.json();
        
        return processarDadosIpcaE(dadosipcae, dataBase, inicioGraca, fimGraca);
        
    } catch (error) {
        console.error(`Erro ao obter dados do IPCA - E: ${error}`);
    }
}

function processarDadosIpcaE(dadosipcae, dataBase, inicioGraca, fimGraca) {
    function strParaData(dataStr) {
        const [dia, mes, ano] = dataStr.split('/');
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }
    
    let ipcaEGraca = [];
    
    if (dataBase <= fimGraca) {
        // Determina o início efetivo: o maior entre dataBase e inicioGraca
        const inicioEfetivo = dataBase > inicioGraca ? dataBase : inicioGraca;
        
        ipcaEGraca = dadosipcae
            .filter(item => {
                const dataItem = strParaData(item.data);
                return inicioEfetivo <= dataItem && dataItem <= fimGraca;
            })
            .map(item => parseFloat(item.valor.replace(',', '.')));
    }
    // Se dataBase > fimGraca, não aplica IPCA (ipcaGraca fica vazio)
    
    let indiceipcae = 1.0;
    for (const valor of ipcaEGraca) {
        indiceipcae *= 1 + (valor / 100);
    }
    
    return indiceipcae;
}

// ====================================
// IPCA
// ====================================

async function calcularIpca(dataBase, inicioGraca, fimGraca) {
    try {
        // Descobre a data final como o último dia do mês anterior ao mês atual
        const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
        const [ano, mes, dia] = dataAtualizacaoInput.split('-');
        const dataReferencia = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

        const primeiroDiaMesAtual = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
        const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual - 1);
        const dataFinal = ultimoDiaMesAnterior.toLocaleDateString('pt-BR');
        
        // Série 433 = IPCA normal (não é o IPCA-E)
        const urlipca = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/08/2025&dataFinal=${dataFinal}`;
        
        const response = await fetch(urlipca);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const dadosipca = await response.json();
        
        return processarDadosIpca(dadosipca, dataBase, inicioGraca, fimGraca);
        
    } catch (error) {
        console.error(`Erro ao obter dados do IPCA (433): ${error}`);
        return { indiceipca: 1.0, periodo: '', temDados: false };
    }
}

function processarDadosIpca(dadosipca, dataBase, inicioGraca, fimGraca) {
    function strParaData(dataStr) {
        const [dia, mes, ano] = dataStr.split('/');
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }
    
    // Data de corte: 01/08/2025
    const dataAgosto2025 = new Date(2025, 7, 1); // mês 7 = agosto (0-indexed)
    
    // Se não temos dados ou data de atualização é antes de agosto/2025, retorna neutro
    if (!dadosipca || dadosipca.length === 0) {
        return { indiceipca: 1.0, periodo: '', temDados: false };
    }
    
    // IPCA aplica apenas de agosto/2025 em diante
    const dataInicioIPCA = dataAgosto2025;
    
    // Filtrar dados de agosto/2025 até a data de atualização
    const dadosIPCAFiltrados = dadosipca.filter(item => {
        const dataItem = strParaData(item.data);
        return dataItem >= dataInicioIPCA;
    });
    
    const valoresIPCA = dadosIPCAFiltrados.map(item => parseFloat(item.valor.replace(',', '.')));
    
    // Calcular índice acumulado
    let indiceipca = 1.0;
    for (const valor of valoresIPCA) {
        indiceipca *= 1 + (valor / 100);
    }

    const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
    const [anoAtual, mesAtual, diaAtual] = dataAtualizacaoInput.split('-');
    const dataAtualReferencia = new Date(parseInt(anoAtual), parseInt(mesAtual) - 1, parseInt(diaAtual));
    
    // Mês da atualização - 1 (porque IPCA é sempre do mês anterior)
    const mesReferencia = dataAtualReferencia.getMonth(); // 0-indexed
    const anoReferencia = dataAtualReferencia.getFullYear();

    const mesInicio = dataAgosto2025.getFullYear() * 12 + dataAgosto2025.getMonth();
    const mesFim = anoReferencia * 12 + (mesReferencia - 1); // -1 para mês anterior
    const quantidadeMesesReal = Math.max(0, mesFim - mesInicio + 1); // +1 porque inclui o mês de início
    
    // Definir período
    let periodo = '';
    if (dadosIPCAFiltrados.length > 0) {
        const primeiraData = dadosIPCAFiltrados[0].data;
        const ultimaData = dadosIPCAFiltrados[dadosIPCAFiltrados.length - 1].data;
        periodo = `${primeiraData} a ${ultimaData}`;
    }
    
    return {
        indiceipca,
        periodo,
        temDados: valoresIPCA.length > 0,
        quantidadeMeses: valoresIPCA.length //quantidadeMesesReal 
    };
}

//Juros 2% a.a

function calcularJuros2PorcentoAA(quantidadeMeses) {
    if (!quantidadeMeses || quantidadeMeses <= 0) {
        return 0;
    }
    
    const percentual = (0.02 / 12) * quantidadeMeses;
    return percentual;
}

// ====================================
// COMPARAÇÃO SELIC VS IPCA + 2% A.A (Pós agosto/2025)
// ====================================

async function calcularSelicPosAgosto2025() {
    try {
        const dataAgosto2025 = new Date(2025, 7, 1); // 01/08/2025
        
        // Pega a data de atualização do formulário
        const dataAtualizacaoInput = document.getElementById("dataatualizacao").value;
        const [ano, mes, dia] = dataAtualizacaoInput.split('-');
        const dataAtualizacao = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        
        // Se data de atualização é antes de agosto/2025, retorna neutro
        if (dataAtualizacao <= dataAgosto2025) {
            return {
                indiceSelecionado: 1.0,
                tipoIndice: 'nenhum',
                indiceSelic: 1.0,
                indiceIpcaMais2: 1.0,
                selicMaior: false,
                quantidadeMeses: 0,
                periodo: ''
            };
        }
        
        // 1. Buscar SELIC de agosto/2025 até data atual
        const primeiroDiaMesAtual = new Date(dataAtualizacao.getFullYear(), dataAtualizacao.getMonth(), 1);
        const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual - 1);
        const dataFinal = ultimoDiaMesAnterior.toLocaleDateString('pt-BR');
        
        const urlselic = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=01/08/2025&dataFinal=${dataFinal}`;
        const responseSelic = await fetch(urlselic);
        
        if (!responseSelic.ok) {
            throw new Error(`Erro ao buscar SELIC: ${responseSelic.status}`);
        }
        
        const dadosSelic = await responseSelic.json();
        
        // Calcular índice SELIC acumulado
        let indiceSelic = 1.0;
        for (const item of dadosSelic) {
            const valor = parseFloat(item.valor.replace(',', '.'));
            indiceSelic *= 1 + (valor / 100);
        }
        
        // 2. Buscar IPCA (433) de agosto/2025 até data atual
        const dadosIpca = await calcularIpca(dataAgosto2025, null, null);
        
        // 3. Calcular IPCA + Juros 2% a.a
        const juros2AA = calcularJuros2PorcentoAA(dadosIpca.quantidadeMeses);
        const indiceIpcaMais2 = dadosIpca.indiceipca * (1 + juros2AA);
        
        // 4. Comparar: SELIC > IPCA+2%?
        const selicMaior = indiceSelic > indiceIpcaMais2;
        
        // 5. Retornar o menor índice
        const indiceSelecionado = selicMaior ? indiceIpcaMais2 : indiceSelic;
        const tipoIndice = selicMaior ? 'ipca' : 'selic';
        
        // Período
        let periodo = '';
        if (dadosSelic.length > 0) {
            periodo = `01/08/2025 a ${dadosSelic[dadosSelic.length - 1].data}`;
        }
        
        return {
            indiceSelecionado,      // O menor (que será aplicado)
            tipoIndice,             // 'selic' ou 'ipca'
            indiceSelic,            // SELIC isolada
            indiceIpcaMais2,        // IPCA + 2% a.a
            selicMaior,             // true se SELIC > IPCA+2%
            quantidadeMeses: dadosIpca.quantidadeMeses,
            periodo,
            percentualSelic: ((indiceSelic - 1) * 100).toFixed(4),
            percentualIpcaMais2: ((indiceIpcaMais2 - 1) * 100).toFixed(4),
            percentualJuros2AA: (juros2AA * 100).toFixed(4)
        };
        
    } catch (error) {
        console.error(`Erro em calcularSelicPosAgosto2025: ${error}`);
        return {
            indiceSelecionado: 1.0,
            tipoIndice: 'erro',
            indiceSelic: 1.0,
            indiceIpcaMais2: 1.0,
            selicMaior: false,
            quantidadeMeses: 0,
            periodo: ''
        };
    }
}
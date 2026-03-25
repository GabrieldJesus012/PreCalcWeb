import requests
from datetime import date, datetime

# ====================================
# ÍNDICES CNJ (estáticos)
# ====================================

MESES = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
    "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

INDICES_CNJ = {
    # 1968-1969
    "julho-1968":2.3766255,"agosto-1968":2.3244716,"setembro-1968":2.2827271,"outubro-1968":2.25106,"novembro-1968":2.217677,"dezembro-1968":2.1821434,
    "janeiro-1969":2.1410981,"fevereiro-1969":2.1027271,"março-1969":2.066267,"abril-1969":2.0375611,"maio-1969":2.0064697,"junho-1969":1.9819624,
    "julho-1969":1.9555362,"agosto-1969":1.942091,"setembro-1969":1.9278542,"outubro-1969":1.9104688,"novembro-1969":1.8798598,"dezembro-1969":1.8412823,
    
    # 1970-1971
    "janeiro-1970":1.800848,"fevereiro-1970":1.7613375,"março-1970":1.7266451,"abril-1970":1.7073184,"maio-1970":1.6917904,"junho-1970":1.6761739,
    "julho-1970":1.6507773,"agosto-1970":1.6362565,"setembro-1970":1.6209546,"outubro-1970":1.6018885,"novembro-1970":1.5721689,"dezembro-1970":1.5394815,
    "janeiro-1971":1.5099171,"fevereiro-1971":1.4826188,"março-1971":1.4632754,"abril-1971":1.4488205,"maio-1971":1.4322237,"junho-1971":1.4120702,
    "julho-1971":1.3846389,"agosto-1971":1.3575278,"setembro-1971":1.329601,"outubro-1971":1.301244,"novembro-1971":1.275563,"dezembro-1971":1.2549928,
    
    # 1972-1973
    "janeiro-1972":1.239693,"fevereiro-1972":1.2249585,"março-1972":1.2088431,"abril-1972":1.1952032,"maio-1972":1.1794914,"junho-1972":1.1599378,
    "julho-1972":1.1394877,"agosto-1972":1.1233748,"setembro-1972":1.1140215,"outubro-1972":1.1061046,"novembro-1972":1.0956172,"dezembro-1972":1.0884246,
    "janeiro-1973":1.0761382,"fevereiro-1973":1.0656129,"março-1973":1.0545619,"abril-1973":1.0420264,"maio-1973":1.0302028,"junho-1973":1.0172858,
    "julho-1973":1.0061466,"agosto-1973":0.9972007,"setembro-1973":0.9889252,"outubro-1973":0.9794005,"novembro-1973":0.9727795,"dezembro-1973":0.9645367,
    
    # 1974-1975
    "janeiro-1974":0.9459925,"fevereiro-1974":0.9361227,"março-1974":0.9223112,"abril-1974":0.9108553,"maio-1974":0.8961917,"junho-1974":0.8775275,
    "julho-1974":0.8492863,"agosto-1974":0.8135031,"setembro-1974":0.7764805,"outubro-1974":0.7484388,"novembro-1974":0.7326216,"dezembro-1974":0.7235169,
    "janeiro-1975":0.7143679,"fevereiro-1975":0.7036899,"março-1975":0.6921938,"abril-1975":0.6794291,"maio-1975":0.666136,"junho-1975":0.6511219,
    "julho-1975":0.6394392,"agosto-1975":0.6286861,"setembro-1975":0.6190415,"outubro-1975":0.6067296,"novembro-1975":0.5938325,"dezembro-1975":0.5824938,
    
    # 1976-1977
    "janeiro-1976":0.5719658,"fevereiro-1976":0.5611914,"março-1976":0.5489126,"abril-1976":0.5361777,"maio-1976":0.5229782,"junho-1976":0.5078638,
    "julho-1976":0.4933112,"agosto-1976":0.4810212,"setembro-1976":0.4679752,"outubro-1976":0.4530738,"novembro-1976":0.4373045,"dezembro-1976":0.4244541,
    "janeiro-1977":0.4152786,"fevereiro-1977":0.4082102,"março-1977":0.400325,"abril-1977":0.3914485,"maio-1977":0.3804735,"junho-1977":0.3686124,
    "julho-1977":0.3567162,"agosto-1977":0.3474371,"setembro-1977":0.3404576,"outubro-1977":0.3357513,"novembro-1977":0.331159,"dezembro-1977":0.3262852,
    
    # 1978-1979
    "janeiro-1978":0.3200147,"fevereiro-1978":0.3134001,"março-1978":0.3063011,"abril-1978":0.2986019,"maio-1978":0.2901279,"junho-1978":0.2815487,
    "julho-1978":0.2733153,"agosto-1978":0.2651989,"setembro-1978":0.25803,"outubro-1978":0.251462,"novembro-1978":0.2456308,"dezembro-1978":0.2394985,
    "janeiro-1979":0.2333575,"fevereiro-1979":0.2282044,"março-1979":0.2230193,"abril-1979":0.2175856,"maio-1979":0.2097292,"junho-1979":0.2020075,
    "julho-1979":0.1955035,"agosto-1979":0.190327,"setembro-1979":0.1850037,"outubro-1979":0.1778589,"novembro-1979":0.170058,"dezembro-1979":0.1627145,
    
    # 1980-1981
    "janeiro-1980":0.1563371,"fevereiro-1980":0.1500323,"março-1980":0.1446787,"abril-1980":0.1395176,"maio-1980":0.134541,"junho-1980":0.1301177,
    "julho-1980":0.1260823,"agosto-1980":0.1221721,"setembro-1980":0.1183831,"outubro-1980":0.1149345,"novembro-1980":0.1113712,"dezembro-1980":0.1079184,
    "janeiro-1981":0.1032714,"fevereiro-1981":0.0983531,"março-1981":0.0923506,"abril-1981":0.0868771,"maio-1981":0.0819597,"junho-1981":0.0773206,
    "julho-1981":0.072944,"agosto-1981":0.0688153,"setembro-1981":0.0650428,"outubro-1981":0.061535,"novembro-1981":0.0582165,"dezembro-1981":0.0551816,
    
    # 1982-1983
    "janeiro-1982":0.0524539,"fevereiro-1982":0.0499561,"março-1982":0.0475773,"abril-1982":0.0453117,"maio-1982":0.0429495,"junho-1982":0.0407105,
    "julho-1982":0.0385881,"agosto-1982":0.036404,"setembro-1982":0.0340224,"outubro-1982":0.0317967,"novembro-1982":0.0297165,"dezembro-1982":0.0279028,
    "janeiro-1983":0.0261998,"fevereiro-1983":0.0247168,"março-1983":0.0231648,"abril-1983":0.0212521,"maio-1983":0.0194973,"junho-1983":0.0180531,
    "julho-1983":0.0167468,"agosto-1983":0.0153641,"setembro-1983":0.0141604,"outubro-1983":0.0129319,"novembro-1983":0.0117884,"dezembro-1983":0.0108749,
    
    # 1984-1985
    "janeiro-1984":0.0101068,"fevereiro-1984":0.0092048,"março-1984":0.0081966,"abril-1984":0.0074514,"maio-1984":0.0068425,"junho-1984":0.0062832,
    "julho-1984":0.0057539,"agosto-1984":0.0052166,"setembro-1984":0.0047166,"outubro-1984":0.0042684,"novembro-1984":0.0037908,"dezembro-1984":0.0034493,
    "janeiro-1985":0.0031216,"fevereiro-1985":0.0027722,"março-1985":0.0025157,"abril-1985":0.0022322,"maio-1985":0.001996,"junho-1985":0.0018145,
    "julho-1985":0.0016615,"agosto-1985":0.0015439,"setembro-1985":0.0014272,"outubro-1985":0.0013082,"novembro-1985":0.0012001,"dezembro-1985":0.00108,
    
    # 1986-1987
    "janeiro-1986":0.0009528,"fevereiro-1986":0.0008197,"março-1986":0.7167849,"abril-1986":0.7175942,"maio-1986":0.7120335,"junho-1986":0.7021997,
    "julho-1986":0.6933895,"agosto-1986":0.6852283,"setembro-1986":0.6739057,"outubro-1986":0.6624906,"novembro-1986":0.6501229,"dezembro-1986":0.6294125,
    "janeiro-1987":0.5867511,"fevereiro-1987":0.5022781,"março-1987":0.4199434,"abril-1987":0.3667159,"maio-1987":0.3031719,"junho-1987":0.2455992,
    "julho-1987":0.2080982,"agosto-1987":0.201938,"setembro-1987":0.1898626,"outubro-1987":0.1796563,"novembro-1987":0.1645506,"dezembro-1987":0.1458267,
    
    # 1988-1989
    "janeiro-1988":0.1277614,"fevereiro-1988":0.1096562,"março-1988":0.0929596,"abril-1988":0.0801306,"maio-1988":0.0671787,"junho-1988":0.0570374,
    "julho-1988":0.0477181,"agosto-1988":0.03847,"setembro-1988":0.0318829,"outubro-1988":0.02571,"novembro-1988":0.0202043,"dezembro-1988":0.0159189,
    "janeiro-1989":12.3603833,"fevereiro-1989":8.6605825,"março-1989":7.863249,"abril-1989":7.4118151,"maio-1989":6.9071782,"junho-1989":6.2828366,
    "julho-1989":5.0329457,"agosto-1989":3.9086105,"setembro-1989":3.0220826,"outubro-1989":2.2229176,"novembro-1989":1.6152449,"dezembro-1989":1.1421578,
    
    # 1990-1991
    "janeiro-1990":0.7438344,"fevereiro-1990":0.4764825,"março-1990":0.2757736,"abril-1990":0.1496168,"maio-1990":0.1033265,"junho-1990":0.095788,
    "julho-1990":0.0874377,"agosto-1990":0.0774333,"setembro-1990":0.0691184,"outubro-1990":0.0612969,"novembro-1990":0.053675,"dezembro-1990":0.0464397,
    "janeiro-1991":0.0392559,"fevereiro-1991":0.0327378,"março-1991":0.0268629,"abril-1991":0.0240298,"maio-1991":0.0228833,"junho-1991":0.0214504,
    "julho-1991":0.0193544,"agosto-1991":0.0172591,"setembro-1991":0.0149274,"outubro-1991":0.0129108,"novembro-1991":0.010663,"dezembro-1991":0.0084306,
    
    # 1992-1993
    "janeiro-1992":0.0068,"fevereiro-1992":0.005414,"março-1992":0.0042934,"abril-1992":0.0035183,"maio-1992":0.0029361,"junho-1992":0.0023784,
    "julho-1992":0.0019294,"agosto-1992":0.0015944,"setembro-1992":0.0012948,"outubro-1992":0.0010499,"novembro-1992":0.0008367,"dezembro-1992":0.0006764,
    "janeiro-1993":0.0005477,"fevereiro-1993":0.000423,"março-1993":0.0003338,"abril-1993":0.000265,"maio-1993":0.0002081,"junho-1993":0.0001616,
    "julho-1993":0.000124,"agosto-1993":0.0948816,"setembro-1993":0.0718836,"outubro-1993":0.0534912,"novembro-1993":0.0395748,"dezembro-1993":0.0295551,
    
    # 1994-1995
    "janeiro-1994":0.0216221,"fevereiro-1994":0.0155364,"março-1994":0.0111214,"abril-1994":0.007743,"maio-1994":0.0054818,"junho-1994":0.0038013,
    "julho-1994":7.2267421,"agosto-1994":6.8685226,"setembro-1994":6.5409759,"outubro-1994":6.4362456,"novembro-1994":6.3160917,"dezembro-1994":6.1347593,
    "janeiro-1995":5.9996804,"fevereiro-1995":5.9996804,"março-1995":5.9996804,"abril-1995":5.7498707,"maio-1995":5.7498707,"junho-1995":5.7498707,
    "julho-1995":5.3675089,"agosto-1995":5.3675089,"setembro-1995":5.3675089,"outubro-1995":5.1056133,"novembro-1995":5.1056133,"dezembro-1995":5.1056133,
    
    # 1996-1997
    "janeiro-1996":4.8992201,"fevereiro-1996":4.8992201,"março-1996":4.8992201,"abril-1996":4.8992201,"maio-1996":4.8992201,"junho-1996":4.8992201,
    "julho-1996":4.5891079,"agosto-1996":4.5891079,"setembro-1996":4.5891079,"outubro-1996":4.5891079,"novembro-1996":4.5891079,"dezembro-1996":4.5891079,
    "janeiro-1997":4.4576018,"fevereiro-1997":4.4576018,"março-1997":4.4576018,"abril-1997":4.4576018,"maio-1997":4.4576018,"junho-1997":4.4576018,
    "julho-1997":4.4576018,"agosto-1997":4.4576018,"setembro-1997":4.4576018,"outubro-1997":4.4576018,"novembro-1997":4.4576018,"dezembro-1997":4.4576018,
    
    # 1998-1999
    "janeiro-1998":4.2243094,"fevereiro-1998":4.2243094,"março-1998":4.2243094,"abril-1998":4.2243094,"maio-1998":4.2243094,"junho-1998":4.2243094,
    "julho-1998":4.2243094,"agosto-1998":4.2243094,"setembro-1998":4.2243094,"outubro-1998":4.2243094,"novembro-1998":4.2243094,"dezembro-1998":4.2243094,
    "janeiro-1999":4.1555616,"fevereiro-1999":4.1555616,"março-1999":4.1555616,"abril-1999":4.1555616,"maio-1999":4.1555616,"junho-1999":4.1555616,
    "julho-1999":4.1555616,"agosto-1999":4.1555616,"setembro-1999":4.1555616,"outubro-1999":4.1555616,"novembro-1999":4.1555616,"dezembro-1999":4.1555616,
    
    # 2000-2001
    "janeiro-2000":3.8154156,"fevereiro-2000":3.8154156,"março-2000":3.8154156,"abril-2000":3.8154156,"maio-2000":3.8154156,"junho-2000":3.8154156,
    "julho-2000":3.8154156,"agosto-2000":3.8154156,"setembro-2000":3.8154156,"outubro-2000":3.8154156,"novembro-2000":3.8154156,"dezembro-2000":3.8154156,
    "janeiro-2001":3.5982417,"fevereiro-2001":3.5757147,"março-2001":3.557925,"abril-2001":3.5451624,"maio-2001":3.5275248,"junho-2001":3.5103242,
    "julho-2001":3.4970355,"agosto-2001":3.4644695,"setembro-2001":3.4240655,"outubro-2001":3.4111033,"novembro-2001":3.3985288,"dezembro-2001":3.3652132,
    
    # 2002-2003
    "janeiro-2002":3.3468057,"fevereiro-2002":3.3261834,"março-2002":3.3116123,"abril-2002":3.2984186,"maio-2002":3.2728901,"junho-2002":3.2592014,
    "julho-2002":3.2484814,"agosto-2002":3.2236593,"setembro-2002":3.1917418,"outubro-2002":3.172075,"novembro-2002":3.1437809,"dezembro-2002":3.0797227,
    "janeiro-2003":2.9885713,"fevereiro-2003":2.9305465,"março-2003":2.8677429,"abril-2003":2.8354191,"maio-2003":2.8034597,"junho-2003":2.7798311,
    "julho-2003":2.7737289,"agosto-2003":2.7787306,"setembro-2003":2.7712483,"outubro-2003":2.7555417,"novembro-2003":2.7374743,"dezembro-2003":2.7328285,
    
    # 2004-2005
    "janeiro-2004":2.7203151,"fevereiro-2004":2.7019419,"março-2004":2.6778413,"abril-2004":2.6671726,"maio-2004":2.6615833,"junho-2004":2.6472879,
    "julho-2004":2.6325457,"agosto-2004":2.6082886,"setembro-2004":2.5878446,"outubro-2004":2.575226,"novembro-2004":2.5670116,"dezembro-2004":2.5509407,
    "janeiro-2005":2.5296912,"fevereiro-2005":2.5126055,"março-2005":2.4941488,"abril-2005":2.4854498,"maio-2005":2.4671925,"junho-2005":2.4468834,
    "julho-2005":2.4439507,"agosto-2005":2.4412653,"setembro-2005":2.4344488,"outubro-2005":2.4305599,"novembro-2005":2.4170246,"dezembro-2005":2.3983177,
    
    # 2006-2007
    "janeiro-2006":2.3892386,"fevereiro-2006":2.3771153,"março-2006":2.3648182,"abril-2006":2.3561007,"maio-2006":2.3521021,"junho-2006":2.3457685,
    "julho-2006":2.3492925,"agosto-2006":2.3497624,"setembro-2006":2.3453063,"outubro-2006":2.3441343,"novembro-2006":2.3373559,"dezembro-2006":2.3287396,
    "janeiro-2007":2.3206174,"fevereiro-2007":2.3086127,"março-2007":2.2980417,"abril-2007":2.2886582,"maio-2007":2.2836342,"junho-2007":2.2777121,
    "julho-2007":2.2711259,"agosto-2007":2.2656882,"setembro-2007":2.2562121,"outubro-2007":2.249688,"novembro-2007":2.2443017,"dezembro-2007":2.2391516,
    
    # 2008-2009
    "janeiro-2008":2.2235865,"fevereiro-2008":2.2081296,"março-2008":2.1940875,"abril-2008":2.1890526,"maio-2008":2.176213,"junho-2008":2.1640941,
    "julho-2008":2.1447909,"agosto-2008":2.1313634,"setembro-2008":2.1239296,"outubro-2008":2.1184217,"novembro-2008":2.1120854,"dezembro-2008":2.1017867,
    "janeiro-2009":2.0957091,"fevereiro-2009":2.0873597,"março-2009":2.0742917,"abril-2009":2.0720124,"maio-2009":2.06458,"junho-2009":2.0524704,
    "julho-2009":2.0447005,"agosto-2009":2.0402121,"setembro-2009":2.0355303,"outubro-2009":2.0316702,"novembro-2009":2.0280197,"dezembro-2009":2.0191355,
    
    # 2010-2011
    "janeiro-2010":2.0114919,"fevereiro-2010":2.0010862,"março-2010":1.9824512,"abril-2010":1.9716073,"maio-2010":1.9621888,"junho-2010":1.9499044,
    "julho-2010":1.9462066,"agosto-2010":1.9479598,"setembro-2010":1.9489343,"outubro-2010":1.9429112,"novembro-2010":1.9309394,"dezembro-2010":1.9144749,
    "janeiro-2011":1.9013556,"fevereiro-2011":1.8870143,"março-2011":1.8688861,"abril-2011":1.8577396,"maio-2011":1.8435443,"junho-2011":1.8307292,
    "julho-2011":1.8265282,"agosto-2011":1.8247035,"setembro-2011":1.8197901,"outubro-2011":1.8101961,"novembro-2011":1.802625,"dezembro-2011":1.7943709,
    
    # 2012-2013
    "janeiro-2012":1.7843784,"fevereiro-2012":1.7728548,"março-2012":1.7635083,"abril-2012":1.7591105,"maio-2012":1.7515787,"junho-2012":1.742691,
    "julho-2012":1.7395598,"agosto-2012":1.7338381,"setembro-2012":1.7271024,"outubro-2012":1.7188519,"novembro-2012":1.7077515,"dezembro-2012":1.6985792,
    "janeiro-2013":1.6869393,"fevereiro-2013":1.6722237,"março-2013":1.6609294,"abril-2013":1.6528305,"maio-2013":1.6444439,"junho-2013":1.6369141,
    "julho-2013":1.6307174,"agosto-2013":1.6295766,"setembro-2013":1.6269735,"outubro-2013":1.6225925,"novembro-2013":1.6148413,"dezembro-2013":1.6056888,
    
    # 2014-2015
    "janeiro-2014":1.5937358,"fevereiro-2014":1.5831288,"março-2014":1.572124,"abril-2014":1.5607306,"maio-2014":1.5486512,"junho-2014":1.5397208,
    "julho-2014":1.532518,"agosto-2014":1.5299171,"setembro-2014":1.5277782,"outubro-2014":1.521843,"novembro-2014":1.5145731,"dezembro-2014":1.5088395,
    "janeiro-2015":1.4970131,"fevereiro-2015":1.4838072,"março-2015":1.4643316,"abril-2015":1.4463963,"maio-2015":1.4310837,"junho-2015":1.4225484,
    "julho-2015":1.4086032,"agosto-2015":1.4003412,"setembro-2015":1.3943455,"outubro-2015":1.3889287,"novembro-2015":1.3798219,"dezembro-2015":1.3681922,
    
    # 2016-2017
    "janeiro-2016":1.3522358,"fevereiro-2016":1.3399087,"março-2016":1.3211484,"abril-2016":1.3154918,"maio-2016":1.3088168,"junho-2016":1.2976569,
    "julho-2016":1.292487,"agosto-2016":1.2855451,"setembro-2016":1.279786,"outubro-2016":1.2768493,"novembro-2016":1.2744279,"dezembro-2016":1.2711229,
    "janeiro-2017":1.2687124,"fevereiro-2017":1.2647915,"março-2017":1.2579983,"abril-2017":1.2561142,"maio-2017":1.2534819,"junho-2017":1.2504807,
    "julho-2017":1.2484831,"agosto-2017":1.2507344,"setembro-2017":1.2463721,"outubro-2017":1.2450026,"novembro-2017":1.240784,"dezembro-2017":1.2368261,
    
    # 2018-2019
    "janeiro-2018":1.2325123,"fevereiro-2018":1.2277242,"março-2018":1.2230765,"abril-2018":1.2218547,"maio-2018":1.2192942,"junho-2018":1.2175895,
    "julho-2018":1.2042227,"agosto-2018":1.1965646,"setembro-2018":1.1950111,"outubro-2018":1.1939366,"novembro-2018":1.1870517,"dezembro-2018":1.1848006,
    "janeiro-2019":1.1866993,"fevereiro-2019":1.1831498,"março-2019":1.1791408,"abril-2019":1.1728076,"maio-2019":1.1644237,"junho-2019":1.1603625,
    "julho-2019":1.1596667,"agosto-2019":1.1586239,"setembro-2019":1.1576978,"outubro-2019":1.1566568,"novembro-2019":1.1556167,"dezembro-2019":1.1540011,
    
    # 2020-2021
    "janeiro-2020":1.14201,"fevereiro-2020":1.1339589,"março-2020":1.1314697,"abril-2020":1.1312434,"maio-2020":1.1313565,"junho-2020":1.1380712,
    "julho-2020":1.1378436,"agosto-2020":1.1344403,"setembro-2020":1.1318371,"outubro-2020":1.1267666,"novembro-2020":1.1162736,"dezembro-2020":1.1073045,
    "janeiro-2021":1.0956901,"fevereiro-2021":1.0872099,"março-2021":1.0820162,"abril-2021":1.0720462,"maio-2021":1.0656523,"junho-2021":1.060984,
    "julho-2021":1.0522503,"agosto-2021":1.0447282,"setembro-2021":1.0355122,"outubro-2021":1.0238404,"novembro-2021":1.0117,"dezembro-2021":1
}

def obter_indice_cnj(mes_base: str, ano_base: int) -> float:
    numero_mes = MESES.get(mes_base.lower(), 0)
    if ano_base > 2021 or (ano_base == 2021 and numero_mes > 12):
        return 1.0
    chave = f"{mes_base.lower()}-{ano_base}"
    return INDICES_CNJ.get(chave, 1.0)

PERIODOS_JUROS = [
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
]

def calcular_periodo_graca(ano_orcamento):
    if ano_orcamento <= 2022:
        inicio_graca = date(ano_orcamento - 1, 7, 1)   # Julho
    elif 2023 <= ano_orcamento <= 2026:
        inicio_graca = date(ano_orcamento - 1, 4, 1)   # Abril
    else:
        inicio_graca = date(ano_orcamento - 1, 2, 1)   # Fevereiro
    fim_graca = date(ano_orcamento, 12, 31)
    return inicio_graca, fim_graca


def criar_data_base(mes_base, ano_base):
    numero_mes = MESES[mes_base.lower()]
    return date(ano_base, numero_mes, 1)


def obter_taxa_juros(mes, ano, natureza):
    data_consulta = date(ano, mes, 1)
    for periodo in PERIODOS_JUROS:
        mes_inicio, ano_inicio, mes_fim, ano_fim, juro_alimentar, juro_comum = periodo
        data_inicio = date(ano_inicio, mes_inicio, 1)
        data_fim = date(ano_fim, mes_fim, 1)
        if data_inicio <= data_consulta <= data_fim:
            return juro_alimentar if natureza == 'alimentar' else juro_comum
    return 0


def esta_no_periodo_graca(data, inicio_graca, fim_graca):
    return inicio_graca <= data <= fim_graca


def gerar_meses_entre_datas(data_inicio, data_fim):
    from dateutil.relativedelta import relativedelta
    meses = []
    atual = data_inicio
    while atual <= data_fim:
        meses.append({'mes': atual.month, 'ano': atual.year, 'data': atual})
        atual += relativedelta(months=1)
    return meses


def calcular_soma_juros_mora(mes_base, ano_base, natureza, inicio_graca=None, fim_graca=None):
    data_base = criar_data_base(mes_base, ano_base)
    data_limite = date(2021, 11, 1)
    if data_base > data_limite:
        return 0
    meses_calculo = gerar_meses_entre_datas(data_base, data_limite)
    soma_juros = 0
    for mes_info in meses_calculo:
        mes, ano, data = mes_info['mes'], mes_info['ano'], mes_info['data']
        esta_graca = inicio_graca and fim_graca and esta_no_periodo_graca(data, inicio_graca, fim_graca)
        if esta_graca:
            continue
        taxa = obter_taxa_juros(mes, ano, natureza)
        soma_juros += taxa
    return soma_juros

# ====================================
# SELIC
# ====================================

def calcular_selic(data_base, inicio_graca, fim_graca, data_atualizacao):
    try:
        from datetime import timedelta
        primeiro_dia_mes_atual = data_atualizacao.replace(day=1)
        ultimo_dia_mes_anterior = primeiro_dia_mes_atual - timedelta(days=1)

        data_limite_jul2025 = date(2025, 7, 31)
        data_final_selic = min(ultimo_dia_mes_anterior, data_limite_jul2025)
        data_final_str = data_final_selic.strftime('%d/%m/%Y')

        url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=01/12/2021&dataFinal={data_final_str}'
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        dados = response.json()

        return processar_dados_selic(dados, data_base, inicio_graca, fim_graca)

    except Exception as e:
        raise Exception(f'Erro ao obter SELIC: {e}')


def processar_dados_selic(dados, data_base, inicio_graca, fim_graca):
    def str_para_data(s):
        dia, mes, ano = s.split('/')
        return date(int(ano), int(mes), int(dia))

    selic_antes = []
    periodo_antes = ''
    if data_base < inicio_graca:
        antes = [i for i in dados if data_base <= str_para_data(i['data']) < inicio_graca]
        selic_antes = [float(i['valor'].replace(',', '.')) for i in antes]
        if antes:
            periodo_antes = f"{antes[0]['data']} a {antes[-1]['data']}"

    if data_base > fim_graca:
        apos = [i for i in dados if str_para_data(i['data']) >= data_base]
    else:
        apos = [i for i in dados if str_para_data(i['data']) > fim_graca]

    selic_apos = [float(i['valor'].replace(',', '.')) for i in apos]
    periodo_apos = f"{apos[0]['data']} a {apos[-1]['data']}" if apos else ''

    soma_antes = sum(selic_antes)
    soma_apos = sum(selic_apos)
    soma_total = soma_antes + soma_apos

    return {
        'indiceselic': 1 + (soma_total / 100),
        'indiceSelicAntes': 1 + (soma_antes / 100) if soma_antes > 0 else 1.0,
        'indiceSelicApos': 1 + (soma_apos / 100) if soma_apos > 0 else 1.0,
        'periodoAntesGraca': periodo_antes,
        'periodoAposGraca': periodo_apos,
        'temSelicAntes': len(selic_antes) > 0,
        'temSelicApos': len(selic_apos) > 0,
    }


# ====================================
# IPCA-E
# ====================================

def calcular_ipca_e(data_base, inicio_graca, fim_graca, data_atualizacao):
    try:
        from datetime import timedelta
        ultimo_dia_mes_anterior = data_atualizacao.replace(day=1) - timedelta(days=1)
        data_final_str = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')

        url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.10764/dados?formato=json&dataInicial=01/12/2021&dataFinal={data_final_str}'
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        dados = response.json()

        return processar_dados_ipca_e(dados, data_base, inicio_graca, fim_graca)

    except Exception as e:
        raise Exception(f'Erro ao obter IPCA-E: {e}')


def processar_dados_ipca_e(dados, data_base, inicio_graca, fim_graca):
    def str_para_data(s):
        dia, mes, ano = s.split('/')
        return date(int(ano), int(mes), int(dia))

    data_corte = date(2025, 7, 31)
    fim_graca_efetivo = min(fim_graca, data_corte)

    ipca_e_graca = []
    if data_base <= fim_graca_efetivo:
        inicio_efetivo = max(data_base, inicio_graca)
        ipca_e_graca = [
            float(i['valor'].replace(',', '.')) for i in dados
            if inicio_efetivo <= str_para_data(i['data']) <= fim_graca_efetivo
        ]

    indice = 1.0
    for valor in ipca_e_graca:
        indice *= 1 + (valor / 100)

    return indice


# ====================================
# IPCA (série 433)
# ====================================

def calcular_ipca(data_base, inicio_graca, fim_graca, data_atualizacao):
    try:
        from datetime import timedelta
        ultimo_dia_mes_anterior = data_atualizacao.replace(day=1) - timedelta(days=1)
        data_final_str = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')

        url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/08/2025&dataFinal={data_final_str}'
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        dados = response.json()

        return processar_dados_ipca(dados, inicio_graca, fim_graca)

    except Exception as e:
        return {'indiceipca': 1.0, 'periodo': '', 'temDados': False, 'quantidadeMeses': 0, 'quantidadeMesesForaGraca': 0}


def processar_dados_ipca(dados, inicio_graca, fim_graca):
    def str_para_data(s):
        dia, mes, ano = s.split('/')
        return date(int(ano), int(mes), int(dia))

    data_agosto_2025 = date(2025, 8, 1)

    if not dados:
        return {'indiceipca': 1.0, 'periodo': '', 'temDados': False, 'quantidadeMeses': 0, 'quantidadeMesesForaGraca': 0}

    filtrados = [i for i in dados if str_para_data(i['data']) >= data_agosto_2025]
    valores = [float(i['valor'].replace(',', '.')) for i in filtrados]

    indice = 1.0
    for v in valores:
        indice *= 1 + (v / 100)

    fora_graca = [
        i for i in filtrados
        if not (inicio_graca and fim_graca and inicio_graca <= str_para_data(i['data']) <= fim_graca)
    ]

    periodo = f"{filtrados[0]['data']} a {filtrados[-1]['data']}" if filtrados else ''

    return {
        'indiceipca': indice,
        'periodo': periodo,
        'temDados': len(valores) > 0,
        'quantidadeMeses': len(valores),
        'quantidadeMesesForaGraca': len(fora_graca),
    }


# ====================================
# Juros 2% a.a.
# ====================================

def calcular_juros_2_porcento_aa(quantidade_meses):
    if not quantidade_meses or quantidade_meses <= 0:
        return 0
    return (0.02 / 12) * quantidade_meses


# ====================================
# SELIC pós agosto/2025
# ====================================

def calcular_selic_pos_agosto_2025(data_atualizacao):
    try:
        from datetime import timedelta
        data_agosto_2025 = date(2025, 8, 1)

        if data_atualizacao <= data_agosto_2025:
            return {
                'indiceSelecionado': 1.0, 'tipoIndice': 'nenhum',
                'indiceSelic': 1.0, 'indiceIpcaMais2': 1.0,
                'selicMaior': False, 'quantidadeMeses': 0, 'periodo': ''
            }

        ultimo_dia_mes_anterior = data_atualizacao.replace(day=1) - timedelta(days=1)
        data_final_str = ultimo_dia_mes_anterior.strftime('%d/%m/%Y')

        url_selic = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=01/08/2025&dataFinal={data_final_str}'
        resp_selic = requests.get(url_selic, timeout=10)
        resp_selic.raise_for_status()
        dados_selic = resp_selic.json()

        indice_selic = 1.0
        for item in dados_selic:
            indice_selic *= 1 + (float(item['valor'].replace(',', '.')) / 100)

        dados_ipca = calcular_ipca(data_agosto_2025, None, None, data_atualizacao)
        juros_2aa = calcular_juros_2_porcento_aa(dados_ipca['quantidadeMeses'])
        indice_ipca_mais2 = dados_ipca['indiceipca'] * (1 + juros_2aa)

        selic_maior = indice_selic > indice_ipca_mais2
        indice_selecionado = indice_ipca_mais2 if selic_maior else indice_selic
        tipo_indice = 'ipca' if selic_maior else 'selic'

        periodo = f"01/08/2025 a {dados_selic[-1]['data']}" if dados_selic else ''

        return {
            'indiceSelecionado': indice_selecionado,
            'tipoIndice': tipo_indice,
            'indiceSelic': indice_selic,
            'indiceIpcaMais2': indice_ipca_mais2,
            'selicMaior': selic_maior,
            'quantidadeMeses': dados_ipca['quantidadeMeses'],
            'periodo': periodo,
            'percentualSelic': round((indice_selic - 1) * 100, 4),
            'percentualIpcaMais2': round((indice_ipca_mais2 - 1) * 100, 4),
            'percentualJuros2AA': round(juros_2aa * 100, 4),
        }

    except Exception as e:
        return {
            'indiceSelecionado': 1.0, 'tipoIndice': 'erro',
            'indiceSelic': 1.0, 'indiceIpcaMais2': 1.0,
            'selicMaior': False, 'quantidadeMeses': 0, 'periodo': ''
        }

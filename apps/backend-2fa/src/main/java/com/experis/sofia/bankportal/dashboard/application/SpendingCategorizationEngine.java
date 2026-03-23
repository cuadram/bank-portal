package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class SpendingCategorizationEngine {

    private static final Map<SpendingCategory, List<String>> KEYWORDS = Map.of(
        SpendingCategory.ALIMENTACION, List.of("mercadona","carrefour","lidl","aldi","dia ","supermercado","alimentacion","fruteria","panaderia","eroski"),
        SpendingCategory.TRANSPORTE,   List.of("renfe","metro","bus ","taxi","uber","cabify","gasolina","repsol","bp ","cepsa","parking","peaje","autopista"),
        SpendingCategory.SERVICIOS,    List.of("endesa","iberdrola","naturgy","gas natural","agua ","telefonica","vodafone","orange","movistar","seguros","mutua","mapfre"),
        SpendingCategory.OCIO,         List.of("netflix","spotify","amazon prime","hbo","disney","steam","cine","restaurante","bar ","teatro","concierto","gym","amazon")
    );

    public SpendingCategory categorize(String concept, String issuer) {
        String text = (nvl(concept) + " " + nvl(issuer)).toLowerCase();
        for (var entry : KEYWORDS.entrySet())
            for (String kw : entry.getValue())
                if (text.contains(kw)) return entry.getKey();
        return SpendingCategory.OTROS;
    }

    private String nvl(String s) { return s != null ? s : ""; }
}

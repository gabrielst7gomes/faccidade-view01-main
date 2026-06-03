import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function useLandingData() {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [cursos, setCursos] = useState<any[]>([]);
  const [depoimentos, setDepoimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [
          { data: headlinesData, error: headlinesError },
          { data: configData, error: configError },
          { data: cursosData, error: cursosError },
          { data: depoimentosData, error: depoimentosError }
        ] = await Promise.all([
          supabase.from("hero_headlines").select("*").eq("ativo", true).order("ordem", { ascending: true }),
          supabase.from("config").select("*"),
          supabase.from("cursos").select("*").eq("ativo", true).order("ordem", { ascending: true }),
          supabase.from("depoimentos").select("*").eq("ativo", true).order("ordem", { ascending: true })
        ]);

        if (!isMounted) return;

        if (headlinesError) console.error("Erro ao carregar headlines:", headlinesError);
        if (configError) console.error("Erro ao carregar config:", configError);
        if (cursosError) console.error("Erro ao carregar cursos:", cursosError);
        if (depoimentosError) console.error("Erro ao carregar depoimentos:", depoimentosError);

        if (headlinesData) {
          setHeadlines(headlinesData.map(h => h.texto));
        }
        
        if (configData) {
          const configMap = configData.reduce((acc, curr) => ({
            ...acc,
            [curr.chave]: curr.valor
          }), {});
          setConfig(configMap);
        }

        if (cursosData) setCursos(cursosData);
        if (depoimentosData) setDepoimentos(depoimentosData);
      } catch (error) {
        console.error("Erro inesperado ao carregar dados da LP:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    // Usa um tópico único por montagem para evitar conflito quando o React remonta o hook.
    const realtimeChannel = supabase
      .channel(`landing-data:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_headlines' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cursos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depoimentos' }, () => fetchData())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  return { headlines, config, cursos, depoimentos, loading };
}
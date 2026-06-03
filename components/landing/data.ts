import {
  Stethoscope,
  Dumbbell,
  Calculator,
  Briefcase,
  Scale,
  HeartPulse,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export type Course = {
  name: string;
  level: "Graduação" | "Pós-Graduação";
  area: "Saúde" | "Negócios" | "Jurídico" | "Esporte";
  Icon: typeof Stethoscope;
};

export const COURSES: Course[] = [
  { name: "Enfermagem", level: "Graduação", area: "Saúde", Icon: Stethoscope },
  { name: "Educação Física", level: "Graduação", area: "Esporte", Icon: Dumbbell },
  { name: "Ciências Contábeis", level: "Graduação", area: "Negócios", Icon: Calculator },
  { name: "Administração", level: "Graduação", area: "Negócios", Icon: Briefcase },
  { name: "Direito", level: "Graduação", area: "Jurídico", Icon: Scale },
  { name: "Gestão em Saúde", level: "Pós-Graduação", area: "Saúde", Icon: HeartPulse },
  { name: "MBA em Gestão de Pessoas", level: "Pós-Graduação", area: "Negócios", Icon: GraduationCap },
  { name: "Docência do Ensino Superior", level: "Pós-Graduação", area: "Negócios", Icon: BookOpen },
];

export const AREAS = ["Todos", "Saúde", "Negócios", "Jurídico", "Esporte"] as const;

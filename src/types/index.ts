export type StepType = "etiquette" | "expressive" | "receptive" | "variant" | "action";

export interface EtiquetteStepData {
  type: "etiquette";
  title: string;
  situationContext: string;
  doTip: {
    title: string;
    action: string;
    why: string;
  };
  avoidTip: {
    title: string;
    action: string;
    why: string;
  };
  ruleOfThumb: string;
  iconName: string;
}

export interface ExpressiveStepData {
  type: "expressive";
  title: string;
  signGloss: string;
  phoneticGuide: string;
  englishMeaning: string;
  mediaUrl: string;
  handShape: string;
  movement: string;
  culturalTip: string;
  targetSignId: string;
}

export interface ReceptiveOption {
  id: string;
  text: string;
  correct: boolean;
  explanation: string;
}

export interface ReceptiveStepData {
  type: "receptive";
  title: string;
  colleagueName: string;
  colleagueRole: string;
  mediaUrl: string;
  question: string;
  options: ReceptiveOption[];
  nonVerbalCue: string;
}

export interface VariantStyle {
  era: string;
  name: string;
  description: string;
  influence: string;
  badge: string;
  mediaUrl?: string;
}

export interface VariantStepData {
  type: "variant";
  title: string;
  heritageSign: string;
  headline: string;
  olderStyle: VariantStyle;
  newerStyle: VariantStyle;
  historicalBridge: string;
  respectRule: string;
}

export interface ActionStepData {
  type: "action";
  title: string;
  missionTitle: string;
  steps: string[];
  readySummary: {
    etiquette: string;
    sign: string;
    expectedReply: string;
  };
  encouragement: string;
}

export type StepData =
  | EtiquetteStepData
  | ExpressiveStepData
  | ReceptiveStepData
  | VariantStepData
  | ActionStepData;

export interface Scenario {
  id: string;
  title: string;
  timeTag: string;
  subtitle: string;
  categoryTag: string;
  icon: string;
  steps: StepData[];
}

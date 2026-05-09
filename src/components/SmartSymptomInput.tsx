import { Body3D } from "../Body3D";
import { PainSlider } from "../PainSlider";

export type BodyRegion =
  | "head" | "neck" | "chest" | "abdomen" | "pelvis"
  | "leftArm" | "rightArm" | "leftLeg" | "rightLeg"
  | "upperBack" | "lowerBack" | "leftShoulder" | "rightShoulder"
  | "leftElbow" | "rightElbow" | "leftHand" | "rightHand"
  | "leftKnee" | "rightKnee" | "leftFoot" | "rightFoot";

export interface AIResult {
  summary: string;
  severity: "low" | "moderate" | "high" | "emergency";
  possibleConditions: string[];
  recommendation: string;
  redFlags?: string[];
}

interface Props {
  selected: BodyRegion[];
  onToggleRegion: (r: BodyRegion) => void;
  pain: number;
  setPain: (n: number) => void;
}

/**
 * Pre-visit symptom input: selectable 2D human body map + pain scale slider.
 * Conversational AI chat (voice/photo/text) lives at /ai-chat instead.
 */
export function SmartSymptomInput({ selected, onToggleRegion, pain, setPain }: Props) {
  return (
    <div className="space-y-4">
      <Body3D selected={selected} onToggleRegion={onToggleRegion} />
      <PainSlider value={pain} onChange={setPain} />
    </div>
  );
}

import { Composition } from "remotion";
import {
  FormatExplainer,
  formatExplainerSchema,
  calculateMetadata as formatExplainerCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as formatExplainerFallbackDuration,
} from "./FormatExplainer";
import {
  TreatmentExplainer,
  treatmentExplainerSchema,
  calculateMetadata as treatmentExplainerCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as treatmentExplainerFallbackDuration,
} from "./TreatmentExplainer";
import {
  StackExplainer,
  stackExplainerSchema,
  calculateMetadata as stackExplainerCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as stackExplainerFallbackDuration,
} from "./StackExplainer";
import {
  WorkshopIntroCh03,
  workshopIntroCh03Schema,
  calculateMetadata as workshopIntroCh03CalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as workshopIntroCh03FallbackDuration,
} from "./WorkshopIntroCh03";
import {
  WorkshopIntroCh05,
  workshopIntroCh05Schema,
  calculateMetadata as workshopIntroCh05CalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as workshopIntroCh05FallbackDuration,
} from "./WorkshopIntroCh05";
import {
  WorkshopVideo01TheSetup,
  workshopVideo01TheSetupSchema,
  calculateMetadata as workshopVideo01TheSetupCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as workshopVideo01TheSetupFallbackDuration,
} from "./WorkshopVideo01TheSetup";
import {
  WorkshopVideo02TheSystem,
  workshopVideo02TheSystemSchema,
  calculateMetadata as workshopVideo02TheSystemCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as workshopVideo02TheSystemFallbackDuration,
} from "./WorkshopVideo02TheSystem";
import {
  WorkshopVideo03TheToolkit,
  workshopVideo03TheToolkitSchema,
  calculateMetadata as workshopVideo03TheToolkitCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as workshopVideo03TheToolkitFallbackDuration,
} from "./WorkshopVideo03TheToolkit";
import {
  WorkshopOverview,
  workshopOverviewSchema,
  calculateMetadata as workshopOverviewCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as workshopOverviewFallbackDuration,
} from "./WorkshopOverview";
import {
  UmbrellaTutorial,
  umbrellaTutorialSchema,
  calculateUmbrellaTutorialMetadata,
  UMBRELLA_TUTORIAL_DURATION,
} from "./compositions/UmbrellaTutorial";
import {
  ClaudeCodeToolsWindows,
  claudeCodeToolsWindowsSchema,
  calculateMetadata as claudeCodeToolsWindowsCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as claudeCodeToolsWindowsFallbackDuration,
} from "./ClaudeCodeToolsWindows";
import {
  ClaudeUiWorkflowExplainer,
  claudeUiWorkflowExplainerSchema,
  calculateMetadata as claudeUiWorkflowExplainerCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as claudeUiWorkflowExplainerFallbackDuration,
} from "./ClaudeUiWorkflowExplainer";
import {
  ClaudeVideoEditingFlowExplainer,
  claudeVideoEditingFlowExplainerSchema,
  calculateMetadata as claudeVideoEditingFlowExplainerCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as claudeVideoEditingFlowExplainerFallbackDuration,
} from "./ClaudeVideoEditingFlowExplainer";
import {
  LoomWalkthrough,
  loomWalkthroughSchema,
  calculateMetadata as loomWalkthroughCalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as loomWalkthroughFallbackDuration,
  LOOM_DEFAULT_MIX,
} from "./LoomWalkthrough";
import {
  PipelineProofDemo16,
  pipelineProofDemo16Schema,
  calculateMetadata as pipelineProofDemo16CalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as pipelineProofDemo16FallbackDuration,
} from "./PipelineProofDemo16";
import {
  RetechShowcase45,
  retechShowcase45Schema,
  calculateMetadata as retechShowcase45CalculateMetadata,
  FALLBACK_DURATION_IN_FRAMES as retechShowcase45FallbackDuration,
} from "./RetechShowcase45";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FormatExplainer"
        component={FormatExplainer}
        calculateMetadata={formatExplainerCalculateMetadata}
        durationInFrames={formatExplainerFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={formatExplainerSchema}
        defaultProps={{}}
      />
      <Composition
        id="TreatmentExplainer"
        component={TreatmentExplainer}
        calculateMetadata={treatmentExplainerCalculateMetadata}
        durationInFrames={treatmentExplainerFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={treatmentExplainerSchema}
        defaultProps={{
          sfxIntroVolume: 0.65,
          sfxOutroVolume: 0.55,
          // musicHigh/musicDuck retained at 0 for type compat with shared
          // ExplainerProps — no longer used (BED_VOLUME is hard-coded in source).
          musicHigh: 0,
          musicDuck: 0,
        }}
      />
      <Composition
        id="StackExplainer"
        component={StackExplainer}
        calculateMetadata={stackExplainerCalculateMetadata}
        durationInFrames={stackExplainerFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={stackExplainerSchema}
        defaultProps={{
          sfxIntroVolume: 0.55,
          sfxOutroVolume: 0.55,
          // musicHigh/musicDuck retained at 0 for type compat with shared
          // ExplainerProps — no longer used (BED_VOLUME is hard-coded in source).
          musicHigh: 0,
          musicDuck: 0,
        }}
      />
      <Composition
        id="WorkshopIntroCh03"
        component={WorkshopIntroCh03}
        calculateMetadata={workshopIntroCh03CalculateMetadata}
        durationInFrames={workshopIntroCh03FallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={workshopIntroCh03Schema}
        defaultProps={{
          musicHigh: 0.15,
          musicDuck: 1,
          sfxIntroVolume: 0.7,
          sfxOutroVolume: 0.7,
        }}
      />
      <Composition
        id="WorkshopIntroCh05"
        component={WorkshopIntroCh05}
        calculateMetadata={workshopIntroCh05CalculateMetadata}
        durationInFrames={workshopIntroCh05FallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={workshopIntroCh05Schema}
        defaultProps={{
          musicHigh: 0.15,
          musicDuck: 1,
          sfxIntroVolume: 0.7,
          sfxOutroVolume: 0.7,
        }}
      />
      <Composition
        id="WorkshopVideo01TheSetup"
        component={WorkshopVideo01TheSetup}
        calculateMetadata={workshopVideo01TheSetupCalculateMetadata}
        durationInFrames={workshopVideo01TheSetupFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={workshopVideo01TheSetupSchema}
        defaultProps={{
          musicHigh: 0.15,
          musicDuck: 1,
          sfxIntroVolume: 0.7,
          sfxOutroVolume: 0.7,
        }}
      />
      <Composition
        id="WorkshopVideo02TheSystem"
        component={WorkshopVideo02TheSystem}
        calculateMetadata={workshopVideo02TheSystemCalculateMetadata}
        durationInFrames={workshopVideo02TheSystemFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={workshopVideo02TheSystemSchema}
        defaultProps={{
          musicHigh: 0.15,
          musicDuck: 1,
          sfxIntroVolume: 0.7,
          sfxOutroVolume: 0.7,
        }}
      />
      <Composition
        id="WorkshopVideo03TheToolkit"
        component={WorkshopVideo03TheToolkit}
        calculateMetadata={workshopVideo03TheToolkitCalculateMetadata}
        durationInFrames={workshopVideo03TheToolkitFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={workshopVideo03TheToolkitSchema}
        defaultProps={{
          musicHigh: 0.15,
          musicDuck: 1,
          sfxIntroVolume: 0.7,
          sfxOutroVolume: 0.7,
        }}
      />
      <Composition
        id="WorkshopOverview"
        component={WorkshopOverview}
        calculateMetadata={workshopOverviewCalculateMetadata}
        durationInFrames={workshopOverviewFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={workshopOverviewSchema}
        defaultProps={{
          musicHigh: 0.35,
          musicDuck: 1,
          sfxIntroVolume: 0.7,
          sfxOutroVolume: 0.7,
        }}
      />
      <Composition
        id="UmbrellaTutorial"
        component={UmbrellaTutorial}
        calculateMetadata={calculateUmbrellaTutorialMetadata}
        durationInFrames={UMBRELLA_TUTORIAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
        schema={umbrellaTutorialSchema}
        defaultProps={{ bedVolume: 0.1, sfxIntroVolume: 1, sfxOutroVolume: 0.55 }}
      />
      <Composition
        id="ClaudeCodeToolsWindows"
        component={ClaudeCodeToolsWindows}
        calculateMetadata={claudeCodeToolsWindowsCalculateMetadata}
        durationInFrames={claudeCodeToolsWindowsFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={claudeCodeToolsWindowsSchema}
        defaultProps={{
          bedVolume: 0.1,
          sfxIntroVolume: 0.5,
          sfxOutroVolume: 0.5,
        }}
      />
      <Composition
        id="ClaudeUiWorkflowExplainer"
        component={ClaudeUiWorkflowExplainer}
        calculateMetadata={claudeUiWorkflowExplainerCalculateMetadata}
        durationInFrames={claudeUiWorkflowExplainerFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={claudeUiWorkflowExplainerSchema}
        defaultProps={{
          musicHigh: 0.10,
          musicDuck: 0,
          sfxIntroVolume: 0.55,
          sfxOutroVolume: 0.55,
        }}
      />
      <Composition
        id="ClaudeVideoEditingFlowExplainer"
        component={ClaudeVideoEditingFlowExplainer}
        calculateMetadata={claudeVideoEditingFlowExplainerCalculateMetadata}
        durationInFrames={claudeVideoEditingFlowExplainerFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={claudeVideoEditingFlowExplainerSchema}
        defaultProps={{
          musicHigh: 0.06,
          musicDuck: 0,
          sfxIntroVolume: 0.55,
          sfxOutroVolume: 0.55,
        }}
      />
      <Composition
        id="LoomRemotionUiWalkthrough"
        component={LoomWalkthrough}
        calculateMetadata={loomWalkthroughCalculateMetadata}
        durationInFrames={loomWalkthroughFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={loomWalkthroughSchema}
        defaultProps={{
          sourceMp4: "assets/loom-batch/loom-1-remotion-ui.mp4",
          masteredAudio: "assets/loom-batch-mastered/loom-1-remotion-ui.wav",
          eyebrow: "Loom 1",
          title: "Remotion UI",
          durationSeconds: 131.435,
          musicHigh: 0.24,
          musicDuck: 0.04,
          sfxIntroVolume: 0.45,
          sfxOutroVolume: 0.55,
        }}
      />
      <Composition
        id="LoomAuditionLibraryWalkthrough"
        component={LoomWalkthrough}
        calculateMetadata={loomWalkthroughCalculateMetadata}
        durationInFrames={loomWalkthroughFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={loomWalkthroughSchema}
        defaultProps={{
          sourceMp4: "assets/loom-batch/loom-2-audition-library.mp4",
          masteredAudio:
            "assets/loom-batch-mastered/loom-2-audition-library.wav",
          eyebrow: "Loom 2",
          title: "Audition Library",
          durationSeconds: 159.445,
          musicHigh: 0.24,
          musicDuck: 0.04,
          sfxIntroVolume: 0.45,
          sfxOutroVolume: 0.55,
        }}
      />
      <Composition
        id="LoomLoopCutterWalkthrough"
        component={LoomWalkthrough}
        calculateMetadata={loomWalkthroughCalculateMetadata}
        durationInFrames={loomWalkthroughFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={loomWalkthroughSchema}
        defaultProps={{
          sourceMp4: "assets/loom-batch/loom-3-loop-cutter.mp4",
          masteredAudio: "assets/loom-batch-mastered/loom-3-loop-cutter.wav",
          eyebrow: "Loom 3",
          title: "Loop Cutter",
          durationSeconds: 549.12,
          musicHigh: 0.24,
          musicDuck: 0.04,
          sfxIntroVolume: 0.45,
          sfxOutroVolume: 0.55,
        }}
      />
      <Composition
        id="LoomProcessMetaWalkthrough"
        component={LoomWalkthrough}
        calculateMetadata={loomWalkthroughCalculateMetadata}
        durationInFrames={loomWalkthroughFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={loomWalkthroughSchema}
        defaultProps={{
          sourceMp4: "assets/loom-batch/loom-4-process-meta.mp4",
          masteredAudio: "assets/loom-batch-mastered/loom-4-process-meta.wav",
          eyebrow: "Loom 4",
          title: "The Process",
          durationSeconds: 387.866,
          musicHigh: 0.24,
          musicDuck: 0.04,
          sfxIntroVolume: 0.45,
          sfxOutroVolume: 0.55,
        }}
      />
      <Composition
        id="LoomTheWorkflowWalkthrough"
        component={LoomWalkthrough}
        calculateMetadata={loomWalkthroughCalculateMetadata}
        durationInFrames={loomWalkthroughFallbackDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={loomWalkthroughSchema}
        defaultProps={{
          sourceMp4: "assets/loom-batch/loom-5-the-workflow.mp4",
          masteredAudio: "assets/loom-batch-mastered/loom-5-the-workflow.wav",
          eyebrow: "Loom 5",
          title: "The Workflow",
          durationSeconds: 422.997,
          musicHigh: 0.24,
          musicDuck: 0.04,
          sfxIntroVolume: 0.45,
          sfxOutroVolume: 0.55,
        }}
      />
      <Composition
        id="PipelineProofDemo16"
        component={PipelineProofDemo16}
        calculateMetadata={pipelineProofDemo16CalculateMetadata}
        durationInFrames={pipelineProofDemo16FallbackDuration}
        fps={30}
        width={1080}
        height={1920}
        schema={pipelineProofDemo16Schema}
        defaultProps={{}}
      />
      <Composition
        id="RetechShowcase45"
        component={RetechShowcase45}
        calculateMetadata={retechShowcase45CalculateMetadata}
        durationInFrames={retechShowcase45FallbackDuration}
        fps={30}
        width={1280}
        height={720}
        schema={retechShowcase45Schema}
        defaultProps={{}}
      />
    </>
  );
};

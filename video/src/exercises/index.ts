import { airSquat } from "./airsquat";
import { barbellRow } from "./barbellrow";
import { benchPress } from "./benchpress";
import { birdDog } from "./birddog";
import { burpee } from "./burpee";
import { calfStretch } from "./calfstretch";
import { catCow } from "./catcow";
import { chestStretch } from "./cheststretch";
import { childsPose } from "./childspose";
import { crunch } from "./crunch";
import { cycling } from "./cycling";
import { deadBug } from "./deadbug";
import { deadlift } from "./deadlift";
import { dips } from "./dips";
import { dumbbellCurl } from "./dumbbellcurl";
import { gluteBridge } from "./glutebridge";
import { hamstring } from "./hamstring";
import { hipFlexorStretch } from "./hipflexor";
import { hollowHold } from "./hollowhold";
import { jumpRope } from "./jumprope";
import { latPulldown } from "./latpulldown";
import { legPress } from "./legpress";
import { legRaise } from "./legraise";
import { lunge } from "./lunge";
import { mountainClimber } from "./mountainclimber";
import { overheadPress } from "./overheadpress";
import { pigeonPose } from "./pigeon";
import { pikePushUp } from "./pikepushup";
import { plank } from "./plank";
import { pullUp } from "./pullup";
import { pushup } from "./pushup";
import { quadStretch } from "./quadstretch";
import { rowing } from "./rowing";
import { running } from "./running";
import { russianTwist } from "./russiantwist";
import { shoulderStretch } from "./shoulderstretch";
import { sidePlank } from "./sideplank";
import { squat } from "./squat";
import { swimming } from "./swimming";
import { tricepsStretch } from "./tricepsstretch";
import type { ExerciseVideoDef } from "./types";
import { walking } from "./walking";
import { wallSit } from "./wallsit";

/** 영상을 만드는 종목. 순서는 앱 seed.ts의 기본 종목 순서와 같다(테스트가 확인). */
export const VIDEO_EXERCISES: readonly ExerciseVideoDef[] = [
  // #근력운동
  benchPress,
  squat,
  deadlift,
  overheadPress,
  barbellRow,
  latPulldown,
  legPress,
  dumbbellCurl,
  // #맨몸운동
  pushup,
  pullUp,
  dips,
  airSquat,
  lunge,
  burpee,
  pikePushUp,
  gluteBridge,
  wallSit,
  // #코어운동
  plank,
  sidePlank,
  hollowHold,
  crunch,
  legRaise,
  deadBug,
  birdDog,
  russianTwist,
  mountainClimber,
  // #스트레칭
  hamstring,
  quadStretch,
  hipFlexorStretch,
  pigeonPose,
  calfStretch,
  chestStretch,
  shoulderStretch,
  tricepsStretch,
  catCow,
  childsPose,
  // #유산소
  running,
  walking,
  cycling,
  rowing,
  swimming,
  jumpRope,
];

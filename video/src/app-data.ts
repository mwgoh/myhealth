// 앱의 기본 종목 데이터를 복사하지 않고 그대로 쓴다.
// seed.ts는 ./types를 타입으로만 가져오므로 영상 번들에 zod가 들어가지 않는다.
export { getGuide, SEED_EXERCISES } from "../../src/domain/seed";

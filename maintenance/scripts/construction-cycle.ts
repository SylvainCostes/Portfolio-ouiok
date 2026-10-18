/** One continuous commissioning cycle: pick, hoist, place, light, recover. */
export const CYCLE_DURATION = 40

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function constructionPose(time: number) {
  const t = ((time % CYCLE_DURATION) + CYCLE_DURATION) % CYCLE_DURATION
  const lift = smooth((t - 2) / 5) - smooth((t - 33) / 5)
  const travel = smooth((t - 7) / 6) - smooth((t - 27) / 6)
  const seat = smooth((t - 13) / 4) - smooth((t - 23) / 4)
  return {
    x: 3.3 + (0.35 - 3.3) * travel,
    y: 0.91 + 7.04 * lift - 1.57 * seat,
    z: 1.7 + (0.35 - 1.7) * travel,
    activation: smooth((t - 17) / 2) - smooth((t - 21) / 2),
    phase:
      t < 2 || t >= 38
        ? 'prepare'
        : t < 7
          ? 'hoist'
          : t < 13
            ? 'transport'
            : t < 17
              ? 'assemble'
              : t < 23
                ? 'activate'
                : 'recover'
  }
}

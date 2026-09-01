function isJackpotAllowed(now) {
  const day = now.getDay();
  if (day >= 1 && day <= 4) return false;
  if (day === 5) return now.getHours() >= 17;
  return true;
}

function jackpotRate(now) {
  if (!isJackpotAllowed(now)) return 0;
  const h = now.getHours();
  if (h >= 11 && h < 14) return 0.15;
  if (h >= 17 && h < 21) return 0.4;
  return 0.25;
}

module.exports = { isJackpotAllowed, jackpotRate };

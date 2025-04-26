// ——— pure conversion helpers ———
export function cmFromFtIn(ft, inch = 0) {
    return ft * 30.48 + inch * 2.54;
  }
  
  export function kgFromLbs(lbs) {
    return lbs * 0.45359237;
  }
  
  export function lbsFromKg(kg) {
    return kg / 0.45359237;
  }
  
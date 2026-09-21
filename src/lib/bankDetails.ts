export const BANK_DETAILS = {
  holder: "HIGH SOCIETY BOTANICALS",
  address: "60 rue François 1er, 75008 Paris",
  iban: "FR76 1732 8844 0042 2905 2329 583",
  bic: "SWNBFR22",
} as const;

export const compactBankDetails =
  `Titulaire : ${BANK_DETAILS.holder} — IBAN : ${BANK_DETAILS.iban} — BIC : ${BANK_DETAILS.bic}`;
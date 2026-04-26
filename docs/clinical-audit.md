# Clinical Audit Notes

## Standard

Clinical calculators in this project must be built from the supplied source PDF alone.

That means:

- no inferred thresholds
- no inferred diagnoses
- no inferred urgency upgrades
- no inferred referral specialties
- no synthetic "most likely" pattern labels unless the PDF itself uses them

## LFT discrepancies found in the previous calculator

Source PDF:
`Adult Abnormal Liver Function Tests Primary Care Clinical Pathway`

Problems identified in the previous implementation:

1. `Isolated low albumin` was treated as a standalone synthetic failure diagnosis.
   Source wording only says:
   `Jaundice (Bil>40) and/or significantly abnormal LFTs and/or Concerns re↓albumin or prolonged INR (if done) Suspected malignancy`
   This is not the same as a rule stating that any isolated low albumin automatically means hepatic synthetic failure.

2. The previous calculator invented normal thresholds for:
   - ALT
   - AST
   - ALP
   - GGT
   - bilirubin
   - albumin
   These reference ranges do not appear in the pathway flowchart and should not drive routing logic.

3. The previous calculator invented pattern labels and interpretation logic not present in the PDF:
   - `synthetic_failure`
   - `mixed`
   - `isolated_ggt`
   - narrative explanations for hepatitic/cholestatic patterns beyond the flowchart wording

4. The previous calculator added a `FIB-4` branch and fibrosis risk thresholds.
   These are not present in the supplied pathway PDF and therefore must not be part of the calculator unless sourced from a different explicit document.

5. The previous calculator converted red flags into hard-coded urgency outcomes such as:
   - `urgent_2ww`
   - `routine_referral`
   - `reassure`
   The pathway instead uses explicit action boxes such as:
   - `Urgent Ultrasound and/or Urgent 2 week referral or admission to appropriate specialty`
   - `Seek telephone advice with on-call medical team or hepatology team depending on availability`
   - `Manage in Primary Care: Lifestyle advice and repeat LFTs in 1 year`

6. The previous calculator reassured on `isolated GGT`.
   The supplied pathway PDF does not contain an isolated GGT pathway branch.

7. The previous calculator created specialist destination logic for hepatology referral beyond the wording in box `17.0 (G)`.

## Anaemia calculator notes

Source PDF:
`Abnormal Full Blood Count (FBC) in Adults Primary Care Clinical Pathway`

The anaemia pathway in the repository was much closer to the source than the LFT calculator, but it still needs a box-by-box audit for:

- any branch that converts a named syndrome into a simplified numeric shortcut
- any branch that infers pancytopenia from one surrogate result
- any missing-test behaviour that returns a "most cautious" outcome rather than stopping and requesting the exact next test

Anaemia fixes now applied in the rebuilt calculator:

- `pancytopenia` is no longer inferred from a surrogate count
- ferritin `30-150` no longer defaults to a branch without an explicit inflammatory-state answer
- macrocytic anaemia no longer falls through to `normal B12/folate` when reticulocytes, B12, folate, or symptom status are still unknown
- age-specific urgent GI wording for IDA is now preserved using the exact PDF wording instead of being dropped

## Rebuild approach

1. Use the PDF box labels and branch wording as the source of truth.
2. Ask the clinician to classify the branch explicitly when the PDF requires pattern recognition but does not define a numeric threshold.
3. Stop the calculator where the PDF stops.
4. Record unresolved ambiguity separately instead of filling gaps with synthetic logic.

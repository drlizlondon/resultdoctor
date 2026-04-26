# Live Pathway Input Reference Ranges

This document is the working reference for the two live pathways:

- `Anaemia`
- `Abnormal LFTs`

It separates three things that should not be conflated:

1. `Normal reference range`
2. `Pathway trigger threshold`
3. `Recommended action`

## Key principle

A result can be:

- outside the laboratory normal range
- still not be a stand-alone pathway trigger

or:

- within a broad laboratory range
- but still matter because of a pathway-specific branch threshold

Examples:

- `Hb`
  Normal reference range is sex-specific, but the adult anaemia pathway starts at `Hb <110 g/L`.

- `Bilirubin`
  Normal upper reference is `21 umol/L`, but the urgent LFT red-flag branch uses `bilirubin >40 umol/L`.

- `Albumin`
  Can be below the normal range, but low albumin alone is not treated as a stand-alone urgent trigger.

## Editable source

The structured source for these live input ranges is:

- [live-pathway-inputs.ts](/Users/lizzie/resultdoctor/src/lib/live-pathway-inputs.ts)

That file should be the place we edit if a local lab reference range needs changing.

## Anaemia inputs

| Input | Normal reference | Pathway trigger | Why it matters | If abnormal / relevant, ask for |
|---|---|---|---|---|
| `Haemoglobin` | Male `130-180 g/L`; Female `115-165 g/L` | Adult anaemia pathway entry: `Hb <110 g/L` | Decides whether the anaemia pathway opens | `MCV`, `Ferritin`, `B12`, `Folate`, `CRP`, `Reticulocytes`, `Blood film`, `U&Es / creatinine`, `LFTs` |
| `MCV` | `80-100 fL` | `Microcytic <80`, `Normocytic 80-100`, `Macrocytic >100` | Chooses the main anaemia branch | `Ferritin`, `CRP`, `Iron`, `TIBC`, `Transferrin saturation`, `Reticulocytes`, `B12`, `Folate` |
| `Ferritin` | Male `30-400 mcg/L`; Female `15-200 mcg/L` | `Low <30`; `Indeterminate 30-150` with no known inflammatory states; `High >150` | Helps distinguish iron deficiency from other causes | `CRP`, `Iron`, `TIBC`, `Transferrin saturation`, `Coeliac screen` |
| `Serum Iron` | `10-30 umol/L` | Indeterminate ferritin branch uses `>7` vs `<7` | Used to classify iron replete vs functional iron deficiency | `Ferritin`, `CRP`, `TIBC`, `Transferrin saturation` |
| `TIBC` | `45-72 umol/L` | Indeterminate ferritin branch uses `>45` vs `<45` | Helps classify iron status | `Ferritin`, `CRP`, `Iron`, `Transferrin saturation` |
| `Transferrin saturation` | `20-50%` | Indeterminate ferritin branch uses `>20%` vs `<20%` | Helps classify iron status | `Ferritin`, `CRP`, `Iron`, `TIBC` |
| `CRP` | `<=10 mg/L` | Indeterminate ferritin branch uses `normal` vs `>30 mg/L` | Helps interpret ferritin in inflammation | `Ferritin`, `Iron`, `TIBC`, `Transferrin saturation` |
| `Reticulocytes` | `25-80 x10^9/L` | `Low <80`; `High >80` | Splits underproduction from haemorrhage / haemolysis branches | `Bilirubin`, `Blood film`, `Haemolysis screen` |
| `B12` | `170-900 ng/L` | `Low <170`; separate strong-suspicion branch if `>170` | Part of macrocytic workup | `Folate`, `Intrinsic factor antibody`, `Blood film` |
| `Folate` | `>=3 ug/L` | `Low <3`; `Borderline 3-4.5 with symptoms` | Part of macrocytic workup | `B12`, `Coeliac screen` |

## LFT inputs

| Input | Normal reference | Pathway trigger | Why it matters | If abnormal / relevant, ask for |
|---|---|---|---|---|
| `Bilirubin` | `3-21 umol/L` | Urgent red flag if `>40 umol/L` | Can send the pathway straight to urgent action | `ALT`, `ALP`, `AST`, `GGT`, `Albumin`, `FBC`, `Reticulocytes`, `LDH` |
| `ALT` | `5-40 IU/L` | Hepatitic branch if `ALT>ALP`; urgent specialist advice if `ALT >300 IU/L` | Identifies hepatitic pattern and contains the pathway’s explicit high threshold | `AST`, `ALP`, `GGT`, `Bilirubin`, `Albumin`, `HBsAg`, `HCV Ab` |
| `AST` | `5-40 IU/L` | Used on repeat testing in the hepatitic branch | Supports repeat confirmation | `ALT`, `ALP`, `GGT`, `Bilirubin`, `Albumin` |
| `ALP` | `35-130 IU/L` | Cholestatic branch if `ALP>ALT` | Identifies cholestatic pattern | `GGT`, `Bilirubin`, `Vitamin D`, `Bone profile`, `Ultrasound` |
| `GGT` | `10-55 IU/L` | Supports liver aetiology in cholestatic branch, but no pathway numeric threshold | Helps distinguish liver vs bone source of raised ALP | `ALT`, `ALP`, `Bilirubin`, `Ultrasound` |
| `Albumin` | `35-50 g/L` | Not a stand-alone trigger; concerns about low albumin may contribute to urgent red-flag branch | Supports urgent risk assessment only in context | `INR`, `Ultrasound` |

## Standard action language

The website should use a small, consistent set of action phrases.

| Action label | Meaning |
|---|---|
| `Refer for urgent admission` | Same-day or immediate hospital assessment |
| `Arrange urgent / 2WW referral` | Fast specialist referral pathway |
| `Seek urgent specialist advice` | Telephone advice / same-day consultant discussion |
| `Arrange routine specialist referral` | Non-urgent referral to secondary care |
| `Repeat blood tests` | Recheck in the timeframe stated by the pathway |
| `Start treatment` | Start the treatment explicitly named by the pathway |
| `Arrange ultrasound` | Book imaging explicitly required by the pathway |
| `Request extended liver test panel` | Order the additional blood panel named in the liver pathway |
| `Continue primary care investigation` | Manage and investigate further in primary care |

## Action examples we should render clearly

These are the kinds of outputs the live site should surface in a very explicit way:

- `Refer for urgent admission`
- `Arrange urgent / 2WW referral to haematology`
- `Repeat bloods in 1 month`
- `Recheck in 2 months`
- `Start B12 replacement`
- `Start folate replacement`
- `Commence appropriate treatment and monitor response`
- `Arrange ultrasound`
- `Request extended liver test panel`
- `Continue primary care investigation`

## Important caution

Reference ranges are not the same thing as pathway logic.

The website should do this in order:

1. decide whether the entered value is `normal`, `low`, or `high` against the editable reference range
2. decide whether that result is a `live pathway match`
3. apply any additional pathway-specific trigger thresholds
4. show the clearest action wording available

That ordering is especially important for:

- `Hb`
- `Ferritin`
- `Bilirubin`
- `Albumin`
- `GGT`

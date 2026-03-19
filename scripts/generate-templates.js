/**
 * Script to generate OHADA Draft .docx template files using docxtemplater
 * Run with: node scripts/generate-templates.js
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Ensure templates directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

/**
 * Creates a minimal .docx file with the given content as a docxtemplater template.
 * We build the XML manually to have full control over the template structure.
 */
function createTemplate(fileName, xmlContent) {
  // Create a minimal docx structure
  const zip = new PizZip();

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  // _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // word/_rels/document.xml.rels
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  // word/styles.xml - Professional legal document styling
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/>
      <w:sz w:val="24"/>
    </w:rPr>
    <w:pPr>
      <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
      <w:jc w:val="both"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Titre1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:caps/>
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
      <w:jc w:val="center"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Titre2">
    <w:name w:val="heading 2"/>
    <w:rPr>
      <w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/>
      <w:b/>
      <w:sz w:val="26"/>
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="200" w:after="100"/>
    </w:pPr>
  </w:style>
</w:styles>`);

  // word/document.xml - Main content with template variables
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${xmlContent}
  </w:body>
</w:document>`);

  const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const filePath = path.join(TEMPLATES_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  console.log(`✓ Created: ${fileName}`);
}

// Helper functions for XML generation
function p(text, opts = {}) {
  const { bold, center, size, caps, underline, spacing } = opts;
  let rPr = '';
  if (bold) rPr += '<w:b/>';
  if (size) rPr += `<w:sz w:val="${size}"/>`;
  if (caps) rPr += '<w:caps/>';
  if (underline) rPr += '<w:u w:val="single"/>';

  let pPr = '';
  if (center) pPr += '<w:jc w:val="center"/>';
  if (spacing) pPr += `<w:spacing w:before="${spacing}" w:after="${spacing}"/>`;

  return `    <w:p>
      ${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}
      <w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
    </w:p>`;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function br() {
  return `    <w:p><w:r><w:br/></w:r></w:p>`;
}

function hr() {
  return `    <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="auto"/></w:pBdr></w:pPr></w:p>`;
}

// ==========================================
// TEMPLATE 1: STATUTS SARL OHADA
// ==========================================
createTemplate('statuts-sarl.docx', [
  p('STATUTS', { bold: true, center: true, size: 36, caps: true }),
  br(),
  p('{legal_form_full}', { bold: true, center: true, size: 28 }),
  br(),
  p('« {company_name} »', { bold: true, center: true, size: 28 }),
  br(),
  p('Capital social : {capital_amount_formatted} {capital_currency}', { center: true, size: 24 }),
  p('Siège social : {headquarters_address}, {headquarters_city}, {headquarters_country}', { center: true }),
  br(),
  hr(),
  br(),

  // TITRE I
  p('TITRE I — FORME, OBJET, DÉNOMINATION, SIÈGE, DURÉE', { bold: true, size: 26 }),
  br(),

  p('Article 1 — Forme', { bold: true, underline: true }),
  p('Il est formé entre les propriétaires des parts sociales ci-après créées et de celles qui pourraient l\'être ultérieurement, une {legal_form_full} (« {legal_form} ») régie par l\'Acte uniforme révisé relatif au droit des sociétés commerciales et du groupement d\'intérêt économique (ci-après « l\'Acte uniforme »), ainsi que par les présents statuts.'),
  br(),

  p('Article 2 — Objet social', { bold: true, underline: true }),
  p('La société a pour objet, directement ou indirectement, en tous pays :'),
  p('{business_object}'),
  p('Et généralement, toutes opérations commerciales, financières, industrielles, mobilières et immobilières se rattachant directement ou indirectement à l\'objet social ou susceptibles d\'en faciliter l\'extension ou le développement.'),
  br(),

  p('Article 3 — Dénomination sociale', { bold: true, underline: true }),
  p('La société prend la dénomination sociale de : « {company_name} ».'),
  p('Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination sociale devra toujours être précédée ou suivie des mots « Société à Responsabilité Limitée » ou du sigle « SARL », de l\'énonciation du capital social et du numéro d\'immatriculation au Registre du Commerce et du Crédit Mobilier.'),
  br(),

  p('Article 4 — Siège social', { bold: true, underline: true }),
  p('Le siège social est fixé à {headquarters_address}, {headquarters_city}, {headquarters_country}.'),
  p('Il pourra être transféré en tout autre lieu par décision de l\'assemblée générale extraordinaire des associés.'),
  br(),

  p('Article 5 — Durée', { bold: true, underline: true }),
  p('La durée de la société est fixée à {duration} ({duration_words}) années à compter de la date de son immatriculation au Registre du Commerce et du Crédit Mobilier, sauf les cas de dissolution anticipée ou de prorogation prévus par les présents statuts ou par la loi.'),
  br(),

  // TITRE II
  p('TITRE II — APPORTS, CAPITAL SOCIAL, PARTS SOCIALES', { bold: true, size: 26 }),
  br(),

  p('Article 6 — Apports', { bold: true, underline: true }),
  p('Les soussignés font les apports suivants à la société :'),
  br(),
  p('{#shareholders}'),
  p('- {display_name}, de nationalité {nationality}, demeurant à {address} :'),
  p('  Apport en {contribution_type} d\'un montant de {shares_amount_formatted} {capital_currency}, soit {shares_count_formatted} parts sociales.'),
  br(),
  p('{/shareholders}'),
  p('Total des apports : {capital_amount_formatted} {capital_currency}'),
  br(),

  p('Article 7 — Capital social', { bold: true, underline: true }),
  p('Le capital social est fixé à la somme de {capital_amount_formatted} ({capital_amount_words}) {capital_currency}.'),
  p('Il est divisé en {total_shares_formatted} ({total_shares_words}) parts sociales de {share_value_formatted} ({share_value_words}) {capital_currency} chacune, entièrement souscrites et libérées, numérotées de 1 à {total_shares_formatted}, et attribuées aux associés de la manière suivante :'),
  br(),
  p('{#shareholders}'),
  p('- {display_name} : {shares_count_formatted} parts sociales, numérotées de ......... à .........'),
  p('{/shareholders}'),
  p('Total : {total_shares_formatted} parts sociales'),
  br(),

  p('Article 8 — Parts sociales', { bold: true, underline: true }),
  p('Les parts sociales sont nominatives. Elles ne peuvent être représentées par des titres négociables.'),
  br(),

  // TITRE III
  p('TITRE III — GÉRANCE', { bold: true, size: 26 }),
  br(),

  p('Article 9 — Nomination du gérant', { bold: true, underline: true }),
  p('La société est dirigée par un ou plusieurs gérants, personnes physiques, associés ou non, nommés par les associés.'),
  p('Est nommé en qualité de premier gérant de la société :'),
  p('{#managers}'),
  p('{display_name}, de nationalité {nationality}, né(e) le {birth_date} à {birth_place}, demeurant à {address}.'),
  p('{/managers}'),
  br(),

  p('Article 10 — Pouvoirs du gérant', { bold: true, underline: true }),
  p('Le gérant est investi des pouvoirs les plus étendus pour agir en toute circonstance au nom de la société, dans la limite de l\'objet social et sous réserve des pouvoirs que la loi et les présents statuts attribuent expressément aux associés.'),
  br(),

  p('Article 11 — Durée des fonctions', { bold: true, underline: true }),
  p('Le gérant est nommé pour la durée de la société, sauf décision contraire de l\'assemblée des associés.'),
  br(),

  // TITRE IV
  p('TITRE IV — DÉCISIONS DES ASSOCIÉS', { bold: true, size: 26 }),
  br(),

  p('Article 12 — Assemblées générales', { bold: true, underline: true }),
  p('Les décisions des associés sont prises en assemblée générale. L\'assemblée générale ordinaire est réunie au moins une fois par an dans les six (6) mois de la clôture de l\'exercice social.'),
  br(),

  p('Article 13 — Décisions extraordinaires', { bold: true, underline: true }),
  p('Les décisions extraordinaires, notamment celles portant modification des statuts, sont prises à la majorité des trois quarts (3/4) des parts sociales.'),
  br(),

  // TITRE V
  p('TITRE V — EXERCICE SOCIAL, COMPTES, BÉNÉFICES', { bold: true, size: 26 }),
  br(),

  p('Article 14 — Exercice social', { bold: true, underline: true }),
  p('L\'exercice social commence le {fiscal_year_start} et se termine le {fiscal_year_end} de chaque année.'),
  br(),

  p('Article 15 — Affectation des résultats', { bold: true, underline: true }),
  p('Sur le bénéfice net de chaque exercice, diminué le cas échéant des pertes antérieures, il est prélevé cinq pour cent (5%) pour constituer le fonds de réserve légale. Ce prélèvement cesse d\'être obligatoire lorsque la réserve légale atteint le cinquième (1/5) du capital social.'),
  br(),

  // TITRE VI
  p('TITRE VI — DISSOLUTION, LIQUIDATION', { bold: true, size: 26 }),
  br(),

  p('Article 16 — Dissolution', { bold: true, underline: true }),
  p('La société est dissoute dans les cas prévus par l\'Acte uniforme, ou par décision de l\'assemblée générale extraordinaire des associés.'),
  br(),

  p('Article 17 — Liquidation', { bold: true, underline: true }),
  p('En cas de dissolution, la liquidation est effectuée par le gérant en exercice, sauf si les associés en décident autrement.'),
  br(),

  // Signature
  hr(),
  br(),
  p('Fait à {headquarters_city}, le {current_date}', { center: true }),
  br(),
  p('En autant d\'originaux que de parties, plus un pour le dépôt au Registre du Commerce et du Crédit Mobilier.', { center: true }),
  br(),
  br(),
  p('Les associés :', { bold: true }),
  br(),
  p('{#shareholders}'),
  p('{display_name}'),
  br(),
  br(),
  p('{/shareholders}'),
].join('\n'));


// ==========================================
// TEMPLATE 2: PV DE CONSTITUTION SARL
// ==========================================
createTemplate('pv-constitution-sarl.docx', [
  p('{company_name}', { bold: true, center: true, size: 28 }),
  p('{legal_form_full}', { center: true }),
  p('Au capital de {capital_amount_formatted} {capital_currency}', { center: true }),
  p('Siège social : {headquarters_address}, {headquarters_city}', { center: true }),
  br(),
  hr(),
  br(),
  p('PROCÈS-VERBAL DE L\'ASSEMBLÉE GÉNÉRALE CONSTITUTIVE', { bold: true, center: true, size: 28, caps: true }),
  br(),
  p('En date du {current_date}', { center: true }),
  br(),
  hr(),
  br(),

  p('L\'an {current_year}, le {current_date},', { bold: true }),
  br(),
  p('Les soussignés :'),
  br(),
  p('{#shareholders}'),
  p('{index}. {display_name}, de nationalité {nationality}, demeurant à {address}, titulaire de {shares_count_formatted} parts sociales ;'),
  br(),
  p('{/shareholders}'),

  p('Se sont réunis en assemblée générale constitutive de la {legal_form_full} « {company_name} » conformément aux dispositions de l\'Acte uniforme révisé relatif au droit des sociétés commerciales et du groupement d\'intérêt économique.'),
  br(),

  p('L\'assemblée est présidée par {first_manager.display_name}.'),
  br(),

  p('ORDRE DU JOUR :', { bold: true }),
  p('1. Constitution de la société « {company_name} »'),
  p('2. Adoption des statuts'),
  p('3. Souscription et libération du capital social'),
  p('4. Nomination du gérant'),
  p('5. Pouvoirs pour les formalités'),
  br(),

  p('PREMIÈRE RÉSOLUTION', { bold: true, underline: true }),
  p('L\'assemblée générale constitutive décide la constitution d\'une {legal_form_full} dénommée « {company_name} », dont le siège social est fixé à {headquarters_address}, {headquarters_city}, {headquarters_country}.'),
  p('Cette résolution est adoptée à l\'unanimité.'),
  br(),

  p('DEUXIÈME RÉSOLUTION', { bold: true, underline: true }),
  p('L\'assemblée générale adopte les statuts de la société tels qu\'ils ont été établis et signés par l\'ensemble des associés fondateurs.'),
  p('Cette résolution est adoptée à l\'unanimité.'),
  br(),

  p('TROISIÈME RÉSOLUTION', { bold: true, underline: true }),
  p('L\'assemblée constate que le capital social de {capital_amount_formatted} ({capital_amount_words}) {capital_currency}, divisé en {total_shares_formatted} parts sociales de {share_value_formatted} {capital_currency} chacune, a été entièrement souscrit et libéré par les associés de la manière suivante :'),
  br(),
  p('{#shareholders}'),
  p('- {display_name} : {shares_count_formatted} parts, soit {shares_amount_formatted} {capital_currency}'),
  p('{/shareholders}'),
  br(),
  p('Les fonds correspondant aux apports en numéraire ont été déposés auprès de {deposit_bank}.'),
  p('Cette résolution est adoptée à l\'unanimité.'),
  br(),

  p('QUATRIÈME RÉSOLUTION', { bold: true, underline: true }),
  p('L\'assemblée générale nomme en qualité de gérant de la société, pour une durée illimitée :'),
  p('{#managers}'),
  p('{display_name}, de nationalité {nationality}, demeurant à {address}.'),
  p('{/managers}'),
  p('Le gérant déclare accepter les fonctions qui lui sont confiées et déclare ne faire l\'objet d\'aucune incompatibilité ou interdiction.'),
  p('Cette résolution est adoptée à l\'unanimité.'),
  br(),

  p('CINQUIÈME RÉSOLUTION', { bold: true, underline: true }),
  p('L\'assemblée confère tous pouvoirs au gérant pour accomplir toutes les formalités de publicité et de dépôt requises par la loi, et notamment l\'immatriculation de la société au Registre du Commerce et du Crédit Mobilier.'),
  p('Cette résolution est adoptée à l\'unanimité.'),
  br(),

  p('L\'ordre du jour étant épuisé et plus personne ne demandant la parole, la séance est levée.'),
  br(),

  hr(),
  p('Fait à {headquarters_city}, le {current_date}', { center: true }),
  br(),
  p('Signatures :', { bold: true }),
  br(),
  p('{#shareholders}'),
  p('{display_name}'),
  br(),
  br(),
  p('{/shareholders}'),
].join('\n'));


// ==========================================
// TEMPLATE 3: DÉCLARATION DE SOUSCRIPTION ET DE VERSEMENT
// ==========================================
createTemplate('declaration-souscription.docx', [
  p('DÉCLARATION DE SOUSCRIPTION ET DE VERSEMENT', { bold: true, center: true, size: 30, caps: true }),
  br(),
  p('{company_name}', { bold: true, center: true, size: 28 }),
  p('{legal_form_full} au capital de {capital_amount_formatted} {capital_currency}', { center: true }),
  p('Siège social : {headquarters_address}, {headquarters_city}', { center: true }),
  br(),
  hr(),
  br(),

  p('Je soussigné, {first_manager.display_name}, agissant en qualité de gérant de la {legal_form_full} « {company_name} »,'),
  br(),
  p('DÉCLARE que les {total_shares_formatted} ({total_shares_words}) parts sociales composant le capital social de la société, d\'une valeur nominale de {share_value_formatted} ({share_value_words}) {capital_currency} chacune, ont été réparties, souscrites en totalité et intégralement libérées en numéraire ainsi qu\'il suit :'),
  br(),

  p('TABLEAU DE SOUSCRIPTION ET DE LIBÉRATION :', { bold: true, underline: true }),
  br(),
  p('{#shareholders}'),
  p('{index}. {display_name}'),
  p('   Nombre de parts souscrites : {shares_count_formatted}'),
  p('   Montant souscrit : {shares_amount_formatted} {capital_currency}'),
  p('   Montant libéré : {shares_amount_formatted} {capital_currency}'),
  p('   Type d\'apport : {contribution_type}'),
  br(),
  p('{/shareholders}'),

  p('TOTAL :', { bold: true }),
  p('- Nombre total de parts : {total_shares_formatted}'),
  p('- Capital total souscrit : {capital_amount_formatted} {capital_currency}'),
  p('- Capital total libéré : {capital_amount_formatted} {capital_currency}'),
  br(),

  p('Les fonds ont été déposés au crédit du compte ouvert au nom de la société en formation auprès de {deposit_bank}.'),
  br(),

  p('En foi de quoi, la présente déclaration est établie pour servir et valoir ce que de droit.'),
  br(),
  br(),
  p('Fait à {headquarters_city}, le {current_date}', { center: true }),
  br(),
  br(),
  p('Le Gérant', { center: true, bold: true }),
  br(),
  br(),
  p('{first_manager.display_name}', { center: true }),
].join('\n'));


// ==========================================
// TEMPLATE 4: ACTE DE NOMINATION DU GÉRANT
// ==========================================
createTemplate('nomination-gerant.docx', [
  p('ACTE DE NOMINATION DU GÉRANT', { bold: true, center: true, size: 30, caps: true }),
  br(),
  p('{company_name}', { bold: true, center: true, size: 28 }),
  p('{legal_form_full} au capital de {capital_amount_formatted} {capital_currency}', { center: true }),
  p('Siège social : {headquarters_address}, {headquarters_city}', { center: true }),
  br(),
  hr(),
  br(),

  p('Les associés de la {legal_form_full} « {company_name} »,'),
  br(),
  p('Réunis en assemblée générale constitutive le {current_date},'),
  br(),
  p('Après avoir procédé à la constitution de la société et à l\'adoption de ses statuts,'),
  br(),
  p('DÉCIDENT de nommer en qualité de gérant de la société :', { bold: true }),
  br(),

  p('{#managers}'),
  p('Nom : {display_name}', { bold: true }),
  p('Nationalité : {nationality}'),
  p('Date de naissance : {birth_date}'),
  p('Lieu de naissance : {birth_place}'),
  p('Adresse : {address}'),
  p('Fonction : {title}'),
  br(),
  p('{/managers}'),

  p('Durée du mandat : pour la durée de la société, sauf décision contraire des associés.', { bold: true }),
  br(),
  p('Pouvoirs : le gérant dispose des pouvoirs les plus étendus pour agir en toute circonstance au nom de la société, dans les limites de l\'objet social et sous réserve des pouvoirs reconnus par l\'Acte uniforme aux assemblées d\'associés.'),
  br(),
  p('Le gérant ci-dessus désigné déclare accepter les fonctions qui lui sont confiées et certifie :'),
  p('- ne faire l\'objet d\'aucune incompatibilité ou interdiction de gérer ;'),
  p('- n\'avoir subi aucune condamnation visée à l\'article 10 de l\'Acte uniforme.'),
  br(),

  hr(),
  p('Fait à {headquarters_city}, le {current_date}', { center: true }),
  br(),
  p('Les associés :', { bold: true }),
  br(),
  p('{#shareholders}'),
  p('{display_name}'),
  br(),
  br(),
  p('{/shareholders}'),
  br(),
  p('Le gérant (mention « Lu et approuvé ») :', { bold: true }),
  br(),
  p('{#managers}'),
  p('{display_name}'),
  br(),
  p('{/managers}'),
].join('\n'));


// ==========================================
// TEMPLATE 5: PV AGE MODIFICATION STATUTAIRE
// ==========================================
createTemplate('pv-age-modification.docx', [
  p('{company_name}', { bold: true, center: true, size: 28 }),
  p('{legal_form_full}', { center: true }),
  p('Au capital de {capital_amount_formatted} {capital_currency}', { center: true }),
  p('Siège social : {headquarters_address}, {headquarters_city}', { center: true }),
  p('RCCM : {rccm}', { center: true }),
  br(),
  hr(),
  br(),
  p('PROCÈS-VERBAL DE L\'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE', { bold: true, center: true, size: 28, caps: true }),
  br(),
  p('En date du {current_date}', { center: true }),
  br(),
  hr(),
  br(),

  p('L\'an {current_year}, le {current_date},'),
  br(),
  p('Les associés de la {legal_form_full} « {company_name} » se sont réunis en assemblée générale extraordinaire au siège social, sur convocation du gérant faite conformément aux statuts et à l\'Acte uniforme révisé relatif au droit des sociétés commerciales et du groupement d\'intérêt économique.'),
  br(),

  p('Sont présents :', { bold: true }),
  br(),
  p('{#shareholders}'),
  p('- {display_name}, titulaire de {shares_count_formatted} parts sociales ;'),
  p('{/shareholders}'),
  br(),
  p('Total des parts représentées : {total_shares_formatted} parts sur {total_shares_formatted}, soit 100% du capital social.'),
  p('L\'assemblée peut valablement délibérer.'),
  br(),

  p('L\'assemblée est présidée par {first_manager.display_name}, en sa qualité de gérant.'),
  br(),

  p('Le président rappelle l\'ordre du jour :'),
  p('{custom_resolutions}'),
  br(),

  p('RÉSOLUTION', { bold: true, underline: true }),
  p('Après en avoir délibéré, l\'assemblée générale extraordinaire décide à l\'unanimité :'),
  br(),
  p('{custom_resolutions}'),
  br(),

  p('En conséquence, les statuts de la société sont modifiés conformément à la présente résolution.'),
  br(),
  p('Le gérant est chargé d\'accomplir toutes les formalités de publicité et de dépôt requises par la loi.'),
  br(),

  p('Plus rien n\'étant à l\'ordre du jour, la séance est levée.'),
  br(),
  hr(),
  p('Fait à {headquarters_city}, le {current_date}', { center: true }),
  br(),
  p('Le Gérant', { center: true, bold: true }),
  br(),
  p('{first_manager.display_name}', { center: true }),
  br(),
  br(),
  p('Les associés :', { bold: true }),
  p('{#shareholders}'),
  p('{display_name}'),
  br(),
  p('{/shareholders}'),
].join('\n'));


// ==========================================
// TEMPLATE 6: ACTE DE CESSION DE PARTS SOCIALES
// ==========================================
createTemplate('cession-parts.docx', [
  p('ACTE DE CESSION DE PARTS SOCIALES', { bold: true, center: true, size: 30, caps: true }),
  br(),
  p('{company_name}', { bold: true, center: true, size: 28 }),
  p('{legal_form_full} au capital de {capital_amount_formatted} {capital_currency}', { center: true }),
  p('Siège social : {headquarters_address}, {headquarters_city}', { center: true }),
  p('RCCM : {rccm}', { center: true }),
  br(),
  hr(),
  br(),

  p('ENTRE LES SOUSSIGNÉS :', { bold: true }),
  br(),

  p('LE CÉDANT :', { bold: true, underline: true }),
  p('{cedant_name}, de nationalité {cedant_nationality}, demeurant à {cedant_address},'),
  p('Titulaire de {cedant_shares_count} parts sociales de la société « {company_name} »,'),
  p('Ci-après dénommé « le Cédant »,'),
  br(),

  p('D\'UNE PART,', { bold: true, center: true }),
  br(),

  p('LE CESSIONNAIRE :', { bold: true, underline: true }),
  p('{cessionnaire_name}, de nationalité {cessionnaire_nationality}, demeurant à {cessionnaire_address},'),
  p('Ci-après dénommé « le Cessionnaire »,'),
  br(),

  p('D\'AUTRE PART,', { bold: true, center: true }),
  br(),

  p('IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :', { bold: true }),
  br(),

  p('Article 1 — Objet de la cession', { bold: true, underline: true }),
  p('Par les présentes, le Cédant cède au Cessionnaire, qui accepte, {cession_shares_count} ({cession_shares_count_words}) parts sociales de la {legal_form_full} « {company_name} », d\'une valeur nominale de {share_value_formatted} {capital_currency} chacune.'),
  br(),

  p('Article 2 — Prix de cession', { bold: true, underline: true }),
  p('La présente cession est consentie et acceptée moyennant le prix de {cession_price_formatted} ({cession_price_words}) {capital_currency}, que le Cédant reconnaît avoir reçu du Cessionnaire, ce dont il lui donne bonne et valable quittance.'),
  br(),

  p('Article 3 — Jouissance', { bold: true, underline: true }),
  p('Le Cessionnaire aura la jouissance des parts sociales cédées à compter de ce jour et sera subrogé dans tous les droits et obligations attachés auxdites parts.'),
  br(),

  p('Article 4 — Agrément', { bold: true, underline: true }),
  p('Les associés ont donné leur agrément à la présente cession conformément aux dispositions de l\'article 318 de l\'Acte uniforme et aux stipulations des statuts.'),
  br(),

  p('Article 5 — Formalités', { bold: true, underline: true }),
  p('Les parties donnent tous pouvoirs au porteur d\'un original des présentes pour effectuer toutes les formalités de publicité et de dépôt requises, notamment :'),
  p('- la modification des statuts ;'),
  p('- le dépôt au Registre du Commerce et du Crédit Mobilier ;'),
  p('- la mise à jour du registre des associés.'),
  br(),

  hr(),
  br(),
  p('Fait en trois (3) exemplaires originaux à {headquarters_city}, le {current_date}', { center: true }),
  br(),
  br(),
  p('Le Cédant', { bold: true }),
  p('{cedant_name}'),
  br(),
  br(),
  br(),
  p('Le Cessionnaire', { bold: true }),
  p('{cessionnaire_name}'),
].join('\n'));


console.log('\n✅ All templates generated successfully in:', TEMPLATES_DIR);

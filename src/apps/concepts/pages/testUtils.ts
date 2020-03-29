import uuid from 'uuid'

export interface TestConcept {
  id: string,
  class: string,
  datatype: string,
  names: {name: string, type: string, language: string, preferredInLanguage: string}[],
  descriptions: {description: string, language: string, preferredInLanguage: string}[],
  answers: {source: {search: string, select: string}, concept: {search: string, select: string}}[],
  sets: {source: {search: string, select: string}, concept: {search: string, select: string}}[],
  mappings: {source: {search: string, select: string}, relationship: string, concept: {search: string, select: string}}[],
}

export function newConcept(ownerType: string, owner: string, shortCode: string): [TestConcept, string] {
  const randomString = uuid();
  const id = `TestConcept1-${randomString}`;

  const concept = {
    id,
    class: 'Drug',
    datatype: 'Coded',
    names: [
      {name: `TestConcept One ${randomString}`, type: 'Fully Specified', language: 'English (en)', preferredInLanguage: 'Yes'},
      {name: `TestConcept Uń ${randomString}`, type: 'Synonym', language: 'French (fr)', preferredInLanguage: 'Yes'},
    ],
    descriptions: [
      {description: `TestConcept One ${randomString}`, language: 'English (en)', preferredInLanguage: 'Yes'},
      {description: `TestConcept Uń ${randomString}`, language: 'French (fr)', preferredInLanguage: 'No'},
    ],
    answers: [
      {source: {search: 'CIEL', select: 'CIEL'}, concept: {search: '153557', select: '153557- blunt trauma of eye'}},
      {source: {search: 'CIEL', select: 'CIEL'}, concept: {search: '138571', select: '138571- HIV Positive'}},
    ],
    sets: [
      {source: {search: 'CIEL', select: 'CIEL'}, concept: {search: '110264', select: '110264- HIV Lipodystrophy'}},
    ],
    mappings: [
      {source: {search: 'CIEL', select: 'CIEL'}, relationship: 'Access', concept: {search: '111061', select: '111061- roncha'}},
    ],
  };

  return [concept, `/${ownerType}/${owner}/sources/${shortCode}/concepts/${id}/`];
}

function selectByLabelText(labelText: string, item: string) {
  cy.findByLabelText(labelText).click();
  cy.findByLabelText(labelText).get('ul').findByText(item).click();
}

function selectBySelector(selector: string, item: string) {
  cy.get(selector).click();
  cy.get(selector).get('ul').findByText(item).click();
}
function searchAndSelect(rowSelector: string, placeholderText: string, item: {search: string, select: string}) {
  cy.get(rowSelector).findByText(placeholderText).type(item.search);
  cy.get(rowSelector).get('.css-4ljt47-MenuList').findByText('Loading...').should('not.exist');
  cy.get(rowSelector).get('.css-4ljt47-MenuList').queryByText(item.select).click();
}

function fillNameRow (index: number, concept: TestConcept) {
  cy.get(`[data-testId="names_${index}_name"]`).type(concept.names[index].name);
  selectBySelector(`[data-testId="names_${index}_name_type"]`, concept.names[index].type);
  selectBySelector(`[data-testId="names_${index}_locale"]`, concept.names[index].language);
  selectBySelector(`[data-testId="names_${index}_locale_preferred"]`, concept.names[index].preferredInLanguage);
}

function fillDescriptionRow (index: number, concept: TestConcept) {
  cy.get(`[data-testId="descriptions_${index}_description"]`).type(concept.descriptions[index].description);
  selectBySelector(`[data-testId="descriptions_${index}_locale"]`, concept.descriptions[index].language);
  selectBySelector(`[data-testId="descriptions_${index}_locale_preferred"]`, concept.descriptions[index].preferredInLanguage);
}

function fillMappingRow (index: number, concept: TestConcept, type: 'answers' | 'sets' | 'mappings') {
  searchAndSelect(`[data-testRowId="${type}_${index}"]`, 'Select a source', concept[type][index].source);
  // @ts-ignore
  if (concept[type][index].relationship) selectBySelector(`[data-testId="${type}_${index}_map_type"]`, concept[type][index].relationship);
  searchAndSelect(`[data-testRowId="${type}_${index}"]`, 'Select a concept', concept[type][index].concept);
}

export function createConcept(dictionaryUrl: string, conceptAndUrl: [TestConcept, string]): [TestConcept, string] {
  const [concept, conceptUrl] = conceptAndUrl;

  cy.visit(dictionaryUrl);

  cy.findByText('View Concepts').click();
  cy.findByTitle('Add concepts').click();
  cy.findByText('Create custom concept').click();
  cy.findByText('Other kind').click();

  cy.findByLabelText('OCL ID').type(concept.id);
  selectByLabelText('Class', concept.class);
  selectByLabelText('Datatype', concept.datatype);

  fillNameRow(0, concept);
  cy.findByText('Add Name').click();
  fillNameRow(1, concept);

  cy.findByText('Add Description').click();
  fillDescriptionRow(0, concept);
  cy.findByText('Add Description').click();
  fillDescriptionRow(1, concept);

  cy.findByText('Add Answer').click();
  fillMappingRow(0, concept, 'answers');
  cy.findByText('Add Answer').click();
  fillMappingRow(1, concept, 'answers');

  cy.findByText('Add Set').click();
  fillMappingRow(0, concept, 'sets');

  cy.findByText('Add Mapping').click();
  fillMappingRow(0, concept, 'mappings');

  cy.findByText('Submit').click();

  // wait for request to get done
  cy.findByText('Concept Details');

  return [concept, conceptUrl];
}
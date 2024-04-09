import { defraADONameTransformer } from './DefraNameTransformer'; // Import the function to be tested
import { UserEntity } from '@backstage/catalog-model';
import {
  defaultUserTransformer, normalizeEntityName,
} from '@backstage/plugin-catalog-backend-module-msgraph';
import {
  MICROSOFT_EMAIL_ANNOTATION,
  MICROSOFT_GRAPH_USER_ID_ANNOTATION,
} from '@backstage/plugin-catalog-backend-module-msgraph';

/** default data used to compare original with new function */
function defaultDataSetup() {
  return  createTestData(undefined,'pZ6p6@example.com')
}
function createTestData(userPrincipalName: string | undefined | null, mail: string | undefined | null) {
  const mockGraphUser = {id: 'mockGraphUser', displayName: 'User', mail:mail, userPrincipalName: userPrincipalName};
  const mockUserPhoto = 'mockUserPhoto';
  return {mockGraphUser, mockUserPhoto};
}

function test_default_assertions(result: UserEntity | undefined) {
  expect(result?.apiVersion).toBe('backstage.io/v1alpha1'); // Example assertion
  expect(result?.kind).toBe('User');
  expect(result?.metadata?.name).toBe('pz6p6_example.com');
  expect(result?.metadata?.annotations?.[MICROSOFT_EMAIL_ANNOTATION]).toBe('pZ6p6@example.com');
  expect(result?.metadata?.annotations?.[MICROSOFT_GRAPH_USER_ID_ANNOTATION]).toBe('mockGraphUser');
  expect(result?.spec?.profile?.displayName).toBe('User' );
  expect(result?.spec?.profile?.email).toBe('pZ6p6@example.com' );
  expect(result?.spec?.profile?.picture).toBe('mockUserPhoto' );}
/**
 * Tests to confirm behaviour of the original function
 */
describe('Test original Function', () => {

  it('Transforms correctly for the email field', async () => {
    const {mockGraphUser, mockUserPhoto} = defaultDataSetup();

    const result = await defaultUserTransformer(mockGraphUser, mockUserPhoto);
    test_default_assertions(result);

  });
  it('If missing email does not transform the at all', async () => {
    const mockGraphUser = { id: 'mockGraphUser', displayName: 'User', mail: '', userPrincipalName: 'freds@example.com'  };
    const mockUserPhoto = 'mockUserPhoto';

    const result = await defaultUserTransformer(mockGraphUser, mockUserPhoto);

    expect(result).toBeUndefined();


  });
});

describe('Defra ADO User Transformer', () => {
  it('Same Default Behavior as defaultUserTransformer ', async () => {
    const {mockGraphUser, mockUserPhoto} = defaultDataSetup();
    const result = await defraADONameTransformer(mockGraphUser, mockUserPhoto);
    test_default_assertions(result);

  });

  it('Parses UPN correctly for email is blank ', async () => {
    const {mockGraphUser, mockUserPhoto} = createTestData('freds@example.com', '');

    const result = await defraADONameTransformer(mockGraphUser, mockUserPhoto);
    expect(result?.metadata?.name).toBe('freds_example.com.upn');
    // Assume if there was no email, the email was the UPN
    expect(result?.spec?.profile?.email).toBe('freds@example.com')
    expect(result?.metadata?.annotations?.[MICROSOFT_EMAIL_ANNOTATION]).toBeUndefined();

  });
  it('Parses UPN correctly for email is undefined ', async () => {

    const {mockGraphUser, mockUserPhoto} = createTestData('freds@example.com', undefined );

    const result = await defraADONameTransformer(mockGraphUser, mockUserPhoto);
    expect(result?.metadata?.name).toBe('freds_example.com.upn');
    // Assume if there was no email, the email was the UPN
    expect(result?.spec?.profile?.email).toBe('freds@example.com')

  });

  it('Parses UPN correctly for email is null ', async () => {

    const {mockGraphUser, mockUserPhoto} = createTestData('freds@example.com', null );

    const result = await defraADONameTransformer(mockGraphUser, mockUserPhoto);
    expect(result?.metadata?.name).toBe('freds_example.com.upn');
    expect(result?.spec?.profile?.email).toBe('freds@example.com')

  });

  it("Check get undefined it principalUserName and email is blank", async () => {

    const mockGraphUser = { id: 'someone@there.com', displayName: 'User', mail: '', userPrincipalName: ''  };
    const mockUserPhoto = 'mockUserPhoto';

    const result = await defraADONameTransformer(mockGraphUser, mockUserPhoto);
    expect(result).toBeUndefined();
  });
  it("Check get undefined if principalUserName and email is undefined", async () => {

    const mockGraphUser = { id: 'someone@there.com', displayName: 'User', mail: undefined, userPrincipalName: undefined  };
    const mockUserPhoto = 'mockUserPhoto';

    const result = await defraADONameTransformer(mockGraphUser, mockUserPhoto);
    expect(result).toBeUndefined();
  });
});

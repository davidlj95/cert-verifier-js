import { request } from '../../../services';
import { VerifierError } from '../../../models';
import { SUB_STEPS } from '../../../constants';
import { getText } from '../../i18n/useCases';

/**
 * getIssuerProfile
 *
 * @param issuerId
 * @returns {Promise<any>}
 */
export default async function getIssuerProfile (issuerId, substep = SUB_STEPS.getIssuerProfile) {
  const errorMessage = getText('errors', 'getIssuerProfile');
  if (!issuerId) {
    throw new VerifierError(substep, errorMessage);
  }

  const response = await request({url: issuerId}).catch(() => {
    throw new VerifierError(substep, errorMessage);
  });

  return JSON.parse(response);
}

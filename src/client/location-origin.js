/**
 * Get location origin in a cross-broser way
 *
 * @return {String} location origin
 */
export default function getLocationOrigin() {
  let origin = window.location.origin;

  if (!window.location.origin) {
    origin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
  }

  return origin;
}

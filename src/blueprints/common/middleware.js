
export default async function({ $press, route, payload }) {
  if (route.name == 'source') {
    const params = route.params
    $press.sources[params.source] = payload || await $press.get(`api/source/${params.source}`)
  }
}

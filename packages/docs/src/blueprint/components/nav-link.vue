<script>
import { isExternal, isMailto, isTel } from 'press/docs/utils'

export default {
  functional: true,
  props: {
    item: {
      required: true
    },
    noPrefix: Boolean
  },
  computed: {
    link() {
      return this.item.link
    },
    exact () {
      return this.link === '/'
    }
  },
  render(h, { props, parent }) {
    const { link, text } = props.item

    if (isExternal(link)) {
      const isMailOrTell = isMailto(link) || isTel(link)
      return h('a', {
        staticClass: 'nav-link external',
        attrs: {
          href: link,
          rel: isMailOrTell ? null : 'noopener noreferrer',
          target: isMailOrTell ? null : '_blank'
        }
      }, [
        text,
        h('OutboundLink')
      ])
    }

    return h('NuxtLink', {
      staticClass: 'nav-link',
      props: {
        to: props.noPrefix ? link : `${parent.$docs.prefix}${link}`,
        exact: link === '/'
      }
    }, [ text ])
  }
}
</script>

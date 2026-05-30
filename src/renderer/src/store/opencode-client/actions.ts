import { useOpencodeStore } from './store'

export function setFoo() {
  useOpencodeStore.setState((state) => {
    state.foo = 'bar'
  })
}

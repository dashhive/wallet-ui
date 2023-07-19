import { lit as svg } from '../helpers/lit.js'

const initialState = {
  content: state => svg`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;">
  <defs>
  <g id="icon-x">
    <path id="Vector (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M19.2803 5.21967C19.5732 5.51256 19.5732 5.98744 19.2803 6.28033L5.78033 19.7803C5.48744 20.0732 5.01256 20.0732 4.71967 19.7803C4.42678 19.4874 4.42678 19.0126 4.71967 18.7197L18.2197 5.21967C18.5126 4.92678 18.9874 4.92678 19.2803 5.21967Z" fill="currentColor"/>
    <path id="Vector (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M4.71967 5.21967C5.01256 4.92678 5.48744 4.92678 5.78033 5.21967L19.2803 18.7197C19.5732 19.0126 19.5732 19.4874 19.2803 19.7803C18.9874 20.0732 18.5126 20.0732 18.2197 19.7803L4.71967 6.28033C4.42678 5.98744 4.42678 5.51256 4.71967 5.21967Z" fill="currentColor"/>
  </g>
  <g id="icon-copy">
    <path id="Vector (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M5 2.49957C5 2.22343 5.22386 1.99957 5.5 1.99957H13.5C13.7761 1.99957 14 2.22343 14 2.49957V10.4996C14 10.7757 13.7761 10.9996 13.5 10.9996H10.5C10.2239 10.9996 10 10.7757 10 10.4996C10 10.2234 10.2239 9.99957 10.5 9.99957H13V2.99957H6V5.49957C6 5.77571 5.77614 5.99957 5.5 5.99957C5.22386 5.99957 5 5.77571 5 5.49957V2.49957Z" fill="currentColor"/>
    <path id="Vector (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M2 5.49963C2 5.22349 2.22386 4.99963 2.5 4.99963H10.5C10.7761 4.99963 11 5.22349 11 5.49963V13.4996C11 13.7758 10.7761 13.9996 10.5 13.9996H2.5C2.22386 13.9996 2 13.7758 2 13.4996V5.49963ZM3 5.99963V12.9996H10V5.99963H3Z" fill="currentColor"/>
  </g>
  <g id="icon-warning-circle">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2.5C4.96243 2.5 2.5 4.96243 2.5 8C2.5 11.0376 4.96243 13.5 8 13.5C11.0376 13.5 13.5 11.0376 13.5 8C13.5 4.96243 11.0376 2.5 8 2.5ZM1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8Z" fill="currentColor"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 4.5C8.27614 4.5 8.5 4.72386 8.5 5V8.5C8.5 8.77614 8.27614 9 8 9C7.72386 9 7.5 8.77614 7.5 8.5V5C7.5 4.72386 7.72386 4.5 8 4.5Z" fill="currentColor"/>
    <path d="M8 11.5C8.41421 11.5 8.75 11.1642 8.75 10.75C8.75 10.3358 8.41421 10 8 10C7.58579 10 7.25 10.3358 7.25 10.75C7.25 11.1642 7.58579 11.5 8 11.5Z" fill="currentColor"/>
  </g>
  <g id="icon-eye-open">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.54285 10.7924C6.92667 8.40837 10.6674 5.99902 16 5.99902C21.3326 5.99902 25.0733 8.40837 27.4571 10.7924C28.6462 11.9816 29.5036 13.169 30.065 14.0608C30.3462 14.5075 30.5546 14.8823 30.6944 15.1493C30.7644 15.2828 30.8173 15.3896 30.8537 15.4651C30.8718 15.5029 30.8859 15.5329 30.8959 15.5545L30.9079 15.5807L30.9116 15.5889L30.9134 15.593C30.9136 15.5934 30.9138 15.5939 30 16C30.9138 16.4062 30.9136 16.4066 30.9134 16.4071L30.9129 16.4082L30.9116 16.4111L30.9079 16.4194L30.8959 16.4455C30.8859 16.4672 30.8718 16.4971 30.8536 16.5349C30.8173 16.6104 30.7644 16.7172 30.6944 16.8507C30.5546 17.1176 30.3462 17.4924 30.065 17.939C29.5035 18.8306 28.6461 20.0178 27.4571 21.2067C25.0732 23.5902 21.3325 25.999 16 25.999C10.6675 25.999 6.92677 23.5902 4.54293 21.2067C3.3539 20.0178 2.4965 18.8306 1.93504 17.939C1.65382 17.4924 1.44542 17.1176 1.3056 16.8507C1.23565 16.7172 1.18275 16.6104 1.14638 16.5349C1.12819 16.4971 1.11413 16.4672 1.10412 16.4455L1.09215 16.4194L1.08843 16.4111L1.08713 16.4082L1.08662 16.4071C1.0864 16.4066 1.0862 16.4062 2 16C1.08617 15.5939 1.08637 15.5934 1.08659 15.593L1.0871 15.5918L1.08839 15.5889L1.09211 15.5807L1.10409 15.5545C1.11409 15.5329 1.12816 15.5029 1.14634 15.4651C1.18271 15.3896 1.23561 15.2828 1.30555 15.1493C1.44537 14.8823 1.65377 14.5075 1.93499 14.0608C2.49644 13.169 3.35383 11.9816 4.54285 10.7924ZM2 16L1.08617 15.5939C0.971265 15.8525 0.971276 16.1476 1.0862 16.4062L2 16ZM3.11811 15.9999C3.23576 15.7796 3.40472 15.4803 3.62751 15.1264C4.12856 14.3305 4.89617 13.2677 5.95715 12.2066C8.07333 10.0902 11.3326 7.99902 16 7.99902C20.6674 7.99902 23.9267 10.0902 26.0429 12.2066C27.1038 13.2677 27.8714 14.3305 28.3725 15.1264C28.5953 15.4803 28.7642 15.7796 28.8819 15.9999C28.7642 16.2203 28.5953 16.5195 28.3725 16.8732C27.8715 17.6689 27.1039 18.7315 26.0429 19.7924C23.9268 21.9083 20.6675 23.999 16 23.999C11.3325 23.999 8.07323 21.9083 5.95707 19.7924C4.8961 18.7315 4.1285 17.6689 3.62746 16.8732C3.40469 16.5195 3.23576 16.2203 3.11811 15.9999ZM30 16L30.9138 16.4062C31.0287 16.1476 31.0287 15.8525 30.9138 15.5939L30 16Z" fill="currentColor"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 12.0001C13.7909 12.0001 12 13.7909 12 16.0001C12 18.2092 13.7909 20.0001 16 20.0001C18.2091 20.0001 20 18.2092 20 16.0001C20 13.7909 18.2091 12.0001 16 12.0001ZM10 16.0001C10 12.6864 12.6863 10.0001 16 10.0001C19.3137 10.0001 22 12.6864 22 16.0001C22 19.3138 19.3137 22.0001 16 22.0001C12.6863 22.0001 10 19.3138 10 16.0001Z" fill="currentColor"/>
  </g>
  <g id="icon-eye-closed">
    <path id="Vector (Stroke)" fill-rule="evenodd" clip-rule="evenodd" d="M18.4828 11.2853C18.8415 11.0782 19.3002 11.2011 19.5073 11.5598L21.6457 15.2637C21.8528 15.6224 21.7299 16.0811 21.3712 16.2882C21.0125 16.4953 20.5538 16.3724 20.3467 16.0137L18.2083 12.3098C18.0012 11.9511 18.1241 11.4924 18.4828 11.2853Z" fill="currentColor"/>
    <path id="Vector (Stroke)_2" fill-rule="evenodd" clip-rule="evenodd" d="M14.3245 13.2548C14.7324 13.1829 15.1214 13.4553 15.1933 13.8632L15.8602 17.6454C15.9322 18.0533 15.6598 18.4423 15.2519 18.5143C14.8439 18.5862 14.4549 18.3138 14.383 17.9059L13.7161 14.1236C13.6442 13.7157 13.9166 13.3267 14.3245 13.2548Z" fill="currentColor"/>
    <path id="Vector (Stroke)_3" fill-rule="evenodd" clip-rule="evenodd" d="M9.6675 13.253C10.0754 13.3249 10.3478 13.7139 10.2759 14.1218L9.60885 17.9047C9.53692 18.3126 9.14793 18.585 8.74001 18.5131C8.33209 18.4411 8.05971 18.0521 8.13164 17.6442L8.79866 13.8614C8.87059 13.4534 9.25958 13.1811 9.6675 13.253Z" fill="currentColor"/>
    <path id="Vector (Stroke)_4" fill-rule="evenodd" clip-rule="evenodd" d="M5.51336 11.2823C5.87208 11.4894 5.99498 11.9481 5.78787 12.3068L3.63915 16.0285C3.43204 16.3872 2.97335 16.5101 2.61463 16.303C2.25591 16.0959 2.133 15.6372 2.34011 15.2785L4.48884 11.5568C4.69594 11.1981 5.15464 11.0752 5.51336 11.2823Z" fill="currentColor"/>
    <path id="Vector (Stroke)_5" fill-rule="evenodd" clip-rule="evenodd" d="M2.5287 9.24864C2.85091 8.98834 3.32312 9.03852 3.58343 9.36072C5.07693 11.2094 7.77276 13.5 12.0001 13.5C16.2274 13.5 18.9232 11.2094 20.4167 9.36074C20.677 9.03854 21.1492 8.98836 21.4714 9.24866C21.7936 9.50897 21.8438 9.98118 21.5835 10.3034C19.9247 12.3567 16.8415 15 12.0001 15C7.15868 15 4.07547 12.3567 2.41662 10.3034C2.15632 9.98116 2.2065 9.50894 2.5287 9.24864Z" fill="currentColor"/>
  </g>
  </defs>
  </svg>
  `,
  elements: {
    container: document.createElement('template'),
  },
}

export async function setupSVGSprite(
  el, state = {}
) {
  state = {
    ...initialState,
    ...state,
  }

  let {
    container,
  } = state.elements

  container.innerHTML = state.content(state)

  return {
    element: container,
    render: (position = 'afterend') => {
      // el.insertAdjacentElement(position, container)
      for (let child of container.content.childNodes) {
        if (child.nodeType !== 3) {
          el.insertAdjacentElement(
            position,
            child,
          )
        }
      }
    }
  }
}

export default setupSVGSprite
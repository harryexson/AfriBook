import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 34,
            backgroundColor: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 96,
            color: '#0a0a0a',
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          A
        </div>
      </div>
    ),
    { ...size },
  )
}

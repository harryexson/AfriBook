import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
            width: 380,
            height: 380,
            borderRadius: 96,
            backgroundColor: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 280,
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

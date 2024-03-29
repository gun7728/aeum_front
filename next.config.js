/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/googleApi/:path*',
        destination: `https://maps.googleapis.com/maps/api/directions/:path*`,
      },
      {
        source: '/tourApi/:path*',
        destination: `https://apis.data.go.kr/B551011/KorService1/:path*`,
      },
    ];
  },
  experimental: {
    appDir: true,
  },
  compiler: {
    styledComponents: {
      displayName: false,
      ssr: false
    }
  },
  images:{
    domains:['lh3.googleusercontent.com','tong.visitkorea.or.kr']
  },
  env:{
    NEXT_PUBLIC_MAP_KEY : process.env.NEXT_PUBLIC_MAP_KEY,
    ODSAY_KEY : process.env.ODSAY_KEY,
    GOOGLE_KEY : process.env.GOOGLE_KEY,
    TMAP_KEY : process.env.TMAP_KEY,
    TOUR_API_ECD_KEY : process.env.TOUR_API_ECD_KEY,
    TOUR_API_DCD_KEY : process.env.TOUR_API_DCD_KEY,
  },
}

module.exports = nextConfig

'use client';

import Script from 'next/script';

const GoogleAdSense = ({ publisherId, adSlot, format = 'auto', responsive = true }) => {
  return (
    <>
      <div className="w-full flex justify-center items-center">
        <ins
          className="adsbygoogle w-full max-w-full"
          style={{
            display: 'block',
            textAlign: 'center',
            width: '100%',
            height: 'auto',
            minHeight: '100px',
          }}
          data-ad-client={publisherId}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      </div>

      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        strategy="lazyOnload"
        onLoad={() => {
          // Only push if available and not already processed
          if (typeof window !== 'undefined' && window.adsbygoogle) {
            try {
              window.adsbygoogle = window.adsbygoogle || [];
              window.adsbygoogle.push({});
            } catch (error) {
              console.error('AdSense error:', error);
            }
          }
        }}
      />
    </>
  );
};

export default GoogleAdSense;

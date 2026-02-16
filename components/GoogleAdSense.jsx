'use client';

import Script from 'next/script';

const GoogleAdSense = ({ publisherId, adSlot, format = 'auto', responsive = true }) => {
  return (
    <>
      <div className="google_adsense_container">
        <ins
          className="adsbygoogle"
          style={{
            display: responsive ? 'block' : 'inline-block',
            textAlign: 'center',
            width: responsive ? '100%' : '728px',
            height: responsive ? 'auto' : '90px',
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

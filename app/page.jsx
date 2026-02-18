import Feed from "@components/Feed";
import GoogleAdSense from "@components/GoogleAdSense";

const Home = () => (
  <section className="w-full flex flex-col">
    <div className="flex-center flex-col px-6 sm:px-16">
      <h1 className="head_text text-center">
        Discover & Share
        <br className="max-md:hidden" />
        <span className="orange_gradient text-center"> AI-Powered Prompts</span>
      </h1>
      <p className="desc text-center">
        PromptVerse is an open-source AI prompting tool for modern world to
        discover, create and share creative prompts
      </p>

      <Feed />
    </div>

    <footer className="w-full mt-auto pt-8 px-6 sm:px-16 bg-white/5">
      <div className="w-full max-w-7xl mx-auto">
        <GoogleAdSense
          publisherId="pub-9638300077760993"
          adSlot="4752142806"
          format="auto"
          responsive={true}
        />
      </div>
    </footer>
  </section>
);

export default Home;

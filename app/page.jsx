import Feed from "@components/Feed";
import GoogleAdSense from "@components/GoogleAdSense";

const Home = () => (
  <section className="w-full flex-center flex-col">
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

    <div className="w-full mt-16 pt-8 border-t border-gray-200">
      <GoogleAdSense
        publisherId="pub-9638300077760993"
        adSlot="4752142806"
        format="auto"
        responsive={true}
      />
    </div>
  </section>
);

export default Home;

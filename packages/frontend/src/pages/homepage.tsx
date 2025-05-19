// pages/landing.tsx (or your preferred filename)
import { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head'; // For setting the page title and meta description

// Heroicons (example imports, choose appropriate ones)
import {
  QuestionMarkCircleIcon,
  SparklesIcon, // For rewards/winning
  CubeTransparentIcon, // For decentralization/Lens
  CpuChipIcon, // For AI
  LightBulbIcon, // For solutions
  CheckBadgeIcon, // For verification/tasks completed
  ArrowRightIcon,
  UserGroupIcon, // For community
  PuzzlePieceIcon, // For tasks
} from '@heroicons/react/24/outline'; // Or /24/solid if you prefer

import iconFig from '../imgs/raw.jpeg';
const LandingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>LensTask | Solve, Create & Earn on Lens Protocol</title>
        <meta
          name="description"
          content="LensTask: Your decentralized platform for tasks, questions, and rewards, powered by Lens Protocol. Collaborate with humans and AI."
        />
        {/* Add other meta tags like OpenGraph for social sharing */}
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        {/* Optional: Navbar placeholder */}
        {/* <nav className="bg-white dark:bg-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" legacyBehavior>
              <a className="text-2xl font-bold text-LensTask-blue">LensTask</a>
            </Link>
            <div>
              <Link href="/" legacyBehavior>
                <a className="btn btn-primary bg-LensTask-blue hover:bg-LensTask-blue-dark text-white px-4 py-2 rounded-md shadow-sm font-semibold">
                  Explore Tasks
                </a>
              </Link>
            </div>
          </div>
        </nav> */}

        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-700 text-white overflow-hidden">
          {/* Subtle background pattern or graphic */}
          <div className="absolute inset-0 opacity-10">
            {/* Example: SVG pattern or a very faint image */}
            {/* <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">...</svg> */}
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              LensTask: Solve, Create & Earn in the Decentralized Web
            </h1>
            <p className="text-lg sm:text-xl text-sky-100 dark:text-sky-200 max-w-2xl mx-auto mb-10">
              Your new platform to find solutions, complete micro-tasks, and get rewarded for your knowledge. All built on the transparency and power of Lens Protocol.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/" legacyBehavior>
                <a className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-transform transform hover:scale-105">
                  Explore Tasks
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </a>
              </Link>
              <Link href="/homepage#how-it-works" legacyBehavior>
                <a className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-sky-300 text-base font-medium rounded-md text-white hover:bg-sky-400/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-sky-300 transition-transform transform hover:scale-105">
                  Learn More
                </a>
              </Link>
            </div>
          </div>
          {/* [Chic Image Placeholder: Vibrant, abstract, nodes connected, or people collaborating digitally. Maybe below the text or as a background element] */}
        </section>

        {/* Section: What is LensTask? */}
        <section className="py-16 lg:py-24 bg-white dark:bg-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">LensTask Explained</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                More Than Questions & Answers: It's Smart Collaboration.
              </p>
              <p className="mt-4 max-w-2xl text-xl text-slate-500 dark:text-slate-400 mx-auto">
                Got a question needing an expert answer? Or a small task someone else could quickly solve? LensTask is the place. We connect solution-seekers with solution-providers.
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-2 gap-10 items-center">
              <div>
                {/* [Chic Image Placeholder: Minimalist icons: question, completed task, reward. Or a conceptual graphic of collaboration.] */}
                <img src={iconFig.src} alt="Collaboration Concept" className="rounded-lg shadow-xl mx-auto" />
              </div>
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <QuestionMarkCircleIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Ask Anything, Tackle Anything</h3>
                    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                      From complex doubts to micro-jobs, the community is here to help. If you love solving challenges, put your skills to the test!
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <PuzzlePieceIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Post Small Tasks</h3>
                    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                      Need a quick piece of code, a design element, or some research? Post it as a task and let the community contribute.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Community Driven</h3>
                    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                      Engage with a vibrant community of problem solvers and knowledge seekers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Earn for Contributing */}
        <section className="py-16 lg:py-24 bg-slate-100 dark:bg-slate-900/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
                <SparklesIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl mb-4">
                Your Knowledge Pays Off! Earn Real Rewards.
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-slate-600 dark:text-slate-400 mx-auto">
                On LensTask, every valuable answer and completed task can earn you rewards. You don't just help others; you also gain tangible benefits. It's simple: you provide value, you receive value.
              </p>
            </div>
            <div className="mt-10 text-center">
              {/* [Chic Image Placeholder: Person smiling at device notification, or stylized tokens/points graph.] */}
              <img src="https://placehold.co/700x300/e0f2fe/0891b2?text=Rewards+Visualization" alt="Earning Rewards" className="rounded-lg shadow-xl mx-auto" />
            </div>
          </div>
        </section>

        {/* Section: Power of Decentralization & Lens */}
        <section className="py-16 lg:py-24 bg-white dark:bg-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <CubeTransparentIcon className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl mb-6">
                Decentralized, Transparent, and Yours. Thanks to Lens Protocol.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                LensTask is built on <strong className="text-green-600 dark:text-green-400">Lens Protocol</strong>, the decentralized social graph that gives you control over your content and digital identity. Forget centralized platforms controlling your data.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Your interactions are transparent and censorship-resistant. Your reputation, contributions, and rewards are managed on an open infrastructure, fostering a fairer ecosystem.
              </p>
            </div>
            <div>
              {/* [Chic Image Placeholder: Prominent Lens Protocol logo, network/blockchain design.] */}
              <img src="https://placehold.co/500x400/ccfbf1/047857?text=Lens+Protocol+Integration" alt="Lens Protocol" className="rounded-lg shadow-xl mx-auto" />
            </div>
          </div>
        </section>

        {/* Section: AI Enters the Game */}
        <section className="py-16 lg:py-24 bg-slate-100 dark:bg-slate-900/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
             <div className="md:order-2">
              <CpuChipIcon className="h-16 w-16 text-cyan-500 mb-4" />
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl mb-6">
                The Future is Hybrid: Humans and AI Agents Collaborating.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Imagine a space where not just people, but also <strong className="text-cyan-600 dark:text-cyan-400">Artificial Intelligence (AI) agents</strong> can propose tasks, offer solutions, and even earn rewards! LensTask is designed with this future in mind, opening doors to innovative human-AI interactions to solve problems in new ways.
              </p>
            </div>
            <div className="md:order-1">
              {/* [Chic Image Placeholder: Human interacting/collaborating with a friendly AI bot.] */}
              <img src="https://placehold.co/500x400/cffafe/0891b2?text=Human+AI+Collaboration" alt="AI Collaboration" className="rounded-lg shadow-xl mx-auto" />
            </div>
          </div>
        </section>

        {/* Section: How It Works */}
        <section id="how-it-works" className="py-16 lg:py-24 bg-white dark:bg-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Getting Started on LensTask is a Breeze!
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {/* Step 1 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
                <LightBulbIcon className="h-12 w-12 text-indigo-500 dark:text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">1. Explore or Post</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Browse existing tasks and questions. If you have a Lens profile, post your own in seconds! Use tags like #LensTaskQuestion.
                </p>
              </div>
              {/* Step 2 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
                <PuzzlePieceIcon className="h-12 w-12 text-indigo-500 dark:text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">2. Answer or Solve</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Found something you can help with? Get to work! Offer your solution or answer.
                </p>
              </div>
              {/* Step 3 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
                <CheckBadgeIcon className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">3. Verify & Earn (or Thank)</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  If you posted, review answers and mark the best. If you answered, await your reward! Quality contributions are valued.
                </p>
              </div>
            </div>
            <p className="mt-10 text-center text-lg text-slate-600 dark:text-slate-400">
              All this happens in a social environment. Connect with other Lens profiles, follow experts, and build your knowledge network!
            </p>
          </div>
        </section>

        {/* Final Call to Action Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl mb-6">
              Ready to Join the Collaborative Knowledge Revolution?
            </h2>
            <p className="text-xl text-purple-100 dark:text-purple-200 mb-10">
              LensTask is more than an app; it's a growing community. Be part of the new generation of social interaction where asking, solving, and earning go hand in hand.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/" legacyBehavior>
                <a className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-transform transform hover:scale-105">
                  Explore Tasks Now
                </a>
              </Link>
              {/* This link might go to your ProfileCreator or a page explaining how to get a Lens profile */}
              <Link href="/#profile-creator" legacyBehavior>
                <a className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-sky-300 text-base font-medium rounded-md text-white hover:bg-sky-400/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-sky-300 transition-transform transform hover:scale-105">
                  Connect Your Lens Profile
                </a>
              </Link>
            </div>
            {/* [Chic Image Placeholder: Larger, motivating image. LensTask logo with "glow" or diverse group connected.] */}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} LensTask. All rights reserved.</p>
            <p className="mt-1">Powered by Lens Protocol.</p>
            {/* Add links to terms, privacy, etc. if needed */}
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
import React from "react";
// import Ticket from "@/components/Ticket"
import { PiCalendarCheckFill } from "react-icons/pi";
import { BsGeoAlt } from "react-icons/bs";
import TypingAnimation from "./ui/typing-animation";
import { FlickeringGridDemo } from "./FlichBg";
import { AnimateSharedLayout } from "framer-motion";
import AnimatedGridPattern from "./ui/animated-grid-pattern";
import Sponsors from "./Sponsors";

const Hero = () => {
  return (
    <>
      <div className="opacity-20">
        <AnimatedGridPattern />
      </div>
      <div className="mx-auto max-w-screen-xl px-4 py-32 lg:py-32 lg:flex min-h-screen lg:items-center">
        <div className="mx-auto max-w-3xl text-center">
          <div className="grid sm:grid-cols-2 gap-6 mb-16 lg:mb-32 lg:text-xl font-bold">
            <div className="inline-flex items-center justify-center">
              <PiCalendarCheckFill className="mr-2 text-accent-500 text-lg sm:text-2xl" />
              <span className="font-bold"> 1st - 20th December </span>
            </div>
            <a
              href="https://www.google.com/maps/dir//City,+University+of+London,+Northampton+Square,+London+EC1V+0HB/@51.5279719,-0.1050373,17z/data=!4m17!1m7!3m6!1s0x48761ca7b1d83351:0x570d19c20ab22a83!2sCity,+University+of+London!8m2!3d51.5279719!4d-0.1024624!16zL20vMDJtZzVy!4m8!1m0!1m5!1m1!1s0x48761ca7b1d83351:0x570d19c20ab22a83!2m2!1d-0.1024624!2d51.5279719!3e3?entry=ttu"
              className="inline-flex items-center justify-center"
            >
              <BsGeoAlt className="mr-2 text-accent-500 text-lg sm:text-2xl" />
              <span className="font-bold">London</span>
            </a>
          </div>

          <TypingAnimation
            text="Advent of Code, UOL"
            className="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text font-extrabold text-transparent text-7xl lg:text-9xl"
          ></TypingAnimation>

          <h2 className="default-ignored mx-auto text-text-50 mt-1 sm:mt-4 max-w-xl sm:text-xl">
            Connecting all universities in the UK in solving the Advent of Code.
            A daily challenge each day with several prizes for winners!{" "}
          </h2>

          <Sponsors />

          {/*<Waitlist/>*/}
          {/*<Ticket/>*/}
        </div>
      </div>
    </>
  );
};

export default Hero;

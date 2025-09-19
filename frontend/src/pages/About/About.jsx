import React from "react";
import { Typography, Card } from "@material-tailwind/react";
import aboutImage from "../../assets/about1.jpg";

const About = () => {
  return (
    <div className="max-w-screen-xl mx-auto py-16 px-8 bg-white">
      <Card className="overflow-hidden shadow-xl rounded-2xl border border-[#FF9130]">
        <div className="flex flex-col md:flex-row items-center gap-12 px-8 py-6">
          <div className="md:w-1/2 text-center md:text-left">
            <Typography
              variant="h2"
              className="mb-6 font-extrabold leading-tight text-[#5C2C06]"
            >
              About Us
            </Typography>
            <Typography
              variant="paragraph"
              className="font-normal text-lg leading-relaxed text-[#8A4B08] mb-4"
            >
              Welcome to Eatery Cafe, where culinary excellence meets
              cutting-edge management. Founded with a vision to revolutionize
              dining experiences, we combine a passion for great food with a
              robust restaurant management system. Our platform streamlines
              online ordering, reservation management, and staff coordination,
              ensuring seamless operations and exceptional customer
              satisfaction.
            </Typography>
            <Typography
              variant="paragraph"
              className="font-normal text-lg leading-relaxed text-[#8A4B08]"
            >
              Utilizing the finest ingredients and innovative technology, we
              deliver a variety of delicious dishes tailored to your
              preferences. Our mission is to enhance efficiency, elevate service
              quality, and create memorable dining moments for every guest.
            </Typography>
          </div>
          <div className="md:w-1/2">
            <img
              src={aboutImage}
              alt="About Eatery Cafe"
              className="h-[24rem] w-full object-cover object-center rounded-xl shadow-md"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default About;

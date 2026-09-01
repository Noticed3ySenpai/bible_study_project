"use client";

import dynamic from "next/dynamic";

const StudyEditor = dynamic(() => import("./StudyEditor"), { ssr: false });

export { StudyEditor };

import { redirect } from "next/navigation";

// The old contact page now lives in the Help centre.
export default function Contact() {
  redirect("/help#contact");
}

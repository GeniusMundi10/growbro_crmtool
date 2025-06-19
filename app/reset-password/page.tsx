import { Suspense } from "react";
import ResetClient from "./reset-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetClient />
    </Suspense>
  );
}
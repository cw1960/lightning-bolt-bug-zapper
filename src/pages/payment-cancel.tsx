import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate("/payment");
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-center">
            Your payment process was cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            No charges were made to your account. You can try again whenever
            you're ready.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTryAgain} className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentCancel;

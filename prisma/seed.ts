import { prisma } from "../src/server/db/prisma";

async function main() {
  await prisma.agentRun.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: { email: "demo@acme.com", name: "Demo User" },
  });

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "Getting started",
      messages: {
        create: [
          { role: "user", content: "Hi, I need help with my last order." },
          { role: "assistant", content: "Sure — what seems to be the issue?" },
        ],
      },
    },
  });

  const order1 = await prisma.order.create({
    data: {
      userId: user.id,
      orderNumber: "A10001",
      status: "SHIPPED",
      totalCents: 12999,
      currency: "USD",
      delivery: {
        create: {
          carrier: "UPS",
          trackingCode: "1Z999AA10123456784",
          status: "IN_TRANSIT",
          estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      invoice: {
        create: {
          number: "INV-10001",
          status: "PAID",
          subtotalCents: 12000,
          taxCents: 999,
          totalCents: 12999,
          currency: "USD",
        },
      },
    },
    include: { invoice: true },
  });

  const payment1 = await prisma.payment.create({
    data: {
      userId: user.id,
      provider: "stripe",
      status: "SUCCEEDED",
      amountCents: 12999,
      currency: "USD",
      invoice: {
        connect: { id: order1.invoice!.id },
      },
    },
  });

  await prisma.refund.create({
    data: {
      paymentId: payment1.id,
      status: "NONE",
      amountCents: 0,
    },
  });

  await prisma.order.create({
    data: {
      userId: user.id,
      orderNumber: "A10002",
      status: "PROCESSING",
      totalCents: 4999,
      currency: "USD",
      delivery: {
        create: {
          carrier: "USPS",
          trackingCode: "94001118992238569210",
          status: "LABEL_CREATED",
          estimatedDate: null,
        },
      },
      invoice: {
        create: {
          number: "INV-10002",
          status: "OPEN",
          subtotalCents: 4500,
          taxCents: 499,
          totalCents: 4999,
          currency: "USD",
        },
      },
    },
  });

  // Create a second conversation to exercise listing.
  await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "Billing question",
      messages: {
        create: [
          { role: "user", content: "Can I get an invoice for order A10001?" },
        ],
      },
    },
  });

  // Add a few more messages to the first conversation for history tool.
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: "Order number is A10001. Where is it now?",
    },
  });

  console.log("Seed completed:", { userId: user.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

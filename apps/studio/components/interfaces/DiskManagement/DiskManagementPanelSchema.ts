import { z } from 'zod'

const baseSchema = z.object({
  storageType: z.enum(['io2', 'gp3']).describe('Type of storage: io2 or gp3'),
  totalSize: z
    .number()
    .min(8, { message: 'Allocated disk size must be at least 8 GiB.' })
    .max(16384, { message: 'Allocated disk size must not exceed 16 TiB.' })
    .describe('Allocated disk size in GiB'),
  provisionedIOPS: z.number().describe('Provisioned IOPS for storage type'),
  throughput: z.number().optional().describe('Throughput in MiBps for gp3'),
})

export const DiskStorageSchema = baseSchema.superRefine((data, ctx) => {
  const { storageType, totalSize, provisionedIOPS, throughput } = data

  if (storageType === 'io2') {
    // Validation rules for io2
    const maxIOPS = Math.min(1000 * totalSize, 256000)
    if (provisionedIOPS < 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provisioned IOPS must be at least 100 for io2.',
        path: ['provisionedIOPS'],
      })
    } else if (provisionedIOPS > maxIOPS) {
      if (totalSize >= 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provisioned IOPS must be at most ${maxIOPS} for io2.`,
          path: ['provisionedIOPS'],
        })
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid IOPS value due to invalid disk size`,
          path: ['provisionedIOPS'],
        })
      }
    }
    if (throughput !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Throughput is not configurable for io2.',
        path: ['throughput'],
      })
    }
  } else if (storageType === 'gp3') {
    // Validation rules for gp3
    const maxIOPS = Math.min(500 * totalSize, 16000)
    const maxThroughput = Math.min(0.25 * provisionedIOPS, 1000)

    if (provisionedIOPS < 3000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Provisioned IOPS must be at least 3000 for gp3.`,
        path: ['provisionedIOPS'],
      })
    } else if (provisionedIOPS > maxIOPS) {
      if (totalSize >= 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provisioned IOPS must be at most ${maxIOPS} for gp3.`,
          path: ['provisionedIOPS'],
        })
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid IOPS value due to invalid disk size`,
          path: ['provisionedIOPS'],
        })
      }
    }

    if (throughput !== undefined && (throughput < 125 || throughput > maxThroughput)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Throughput must be set between 125 and ${maxThroughput} MiBps.`,
        path: ['throughput'],
      })
    }
  }
})

export type DiskStorageSchemaType = z.infer<typeof DiskStorageSchema>

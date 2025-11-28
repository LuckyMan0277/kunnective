'use client'

import Link from 'next/link'
import { Lightbulb, Rocket, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HomePage() {
  const features = [
    {
      icon: Lightbulb,
      title: '아이디어 공유',
      description: '제목과 설명만으로 간단하게 아이디어를 공유하고 피드백을 받으세요'
    },
    {
      icon: Rocket,
      title: '프로젝트 팀 모집',
      description: '실제 프로젝트를 위한 팀원을 모집하고 함께 만들어가세요'
    },
    {
      icon: Users,
      title: '인재 헤드헌팅',
      description: '프로젝트 리더가 직접 적합한 인재를 찾아 제안할 수 있습니다'
    }
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.h1
          className="text-5xl font-bold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Kunnective
          <br />
          아이디어로 연결되는 팀 빌딩
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          혼자서는 실현하기 어려운 아이디어를 공유하고,
          <br />
          공감하는 사람들과 연결되어 함께 실현하세요
        </motion.p>

        <motion.div
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/ideas"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition inline-block"
            >
              아이디어 둘러보기
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/projects"
              className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition inline-block"
            >
              프로젝트 찾기
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                className="text-center p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div
                  className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Kunnective. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

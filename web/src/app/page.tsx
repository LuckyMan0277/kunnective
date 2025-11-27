'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, Users, Rocket, TrendingUp, MessageSquare, Target } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-primary opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.3) 0%, transparent 50%)',
          }} />
        </div>

        <div className="container relative z-10 flex flex-col items-center gap-8 py-20 md:py-32 lg:py-40 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex max-w-[980px] flex-col items-center gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium glass"
            >
              ✨ 건국대학교 공식 프로젝트 플랫폼
            </motion.div>

            <h1 className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              아이디어가 현실이 되는
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                프로젝트의 시작
              </span>
            </h1>

            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl md:text-2xl">
              혁신적인 아이디어를 공유하고, 열정적인 팀원을 찾고,
              <br className="hidden sm:inline" />
              함께 성장하는 프로젝트를 만들어보세요
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4"
            >
              <Button
                size="lg"
                asChild
                className="gradient-primary text-white border-0 hover:opacity-90 transition-opacity text-base h-12 px-8"
              >
                <Link href="/signup">
                  지금 시작하기
                  <Rocket className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 hover:bg-muted text-base h-12 px-8"
              >
                <Link href="/ideas">아이디어 둘러보기</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl mt-12"
          >
            {[
              { label: '활성 아이디어', value: '500+', icon: Lightbulb },
              { label: '진행중인 프로젝트', value: '150+', icon: Target },
              { label: '참여 멤버', value: '1,200+', icon: Users },
            ].map((stat, index) => (
              <motion.div key={index} variants={item}>
                <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="pt-6 text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 md:py-28 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Kunnective가 특별한 이유
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            아이디어부터 프로젝트 완성까지, 모든 과정을 함께합니다
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto grid max-w-6xl gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {[
            {
              icon: Lightbulb,
              title: '아이디어 공유',
              description:
                '마크다운 에디터로 구체적인 아이디어를 작성하고, 태그와 카테고리로 분류하여 공유하세요. 다른 학생들의 피드백을 받아 아이디어를 발전시킬 수 있습니다.',
              gradient: 'from-yellow-400 to-orange-500',
            },
            {
              icon: Users,
              title: '팀원 매칭',
              description:
                '프로젝트에 필요한 역할과 기술 스택을 명시하여 딱 맞는 팀원을 찾으세요. 프로필과 관심사를 기반으로 최적의 팀을 구성할 수 있습니다.',
              gradient: 'from-blue-400 to-purple-500',
            },
            {
              icon: Rocket,
              title: '프로젝트 관리',
              description:
                '팀 구성부터 프로젝트 완성까지 체계적으로 관리하세요. 진행 상황을 추적하고, 마일스톤을 설정하며, 팀원들과 실시간으로 소통할 수 있습니다.',
              gradient: 'from-green-400 to-teal-500',
            },
            {
              icon: MessageSquare,
              title: '실시간 채팅',
              description:
                '프로젝트 멤버들과 실시간으로 대화하고 협업하세요. 파일 공유, 코드 스니펫, 아이디어 토론이 모두 한 곳에서 가능합니다.',
              gradient: 'from-pink-400 to-red-500',
            },
            {
              icon: TrendingUp,
              title: '성장 트래킹',
              description:
                '참여한 프로젝트, 기여도, 획득한 스킬을 포트폴리오로 관리하세요. 성장 과정을 기록하고 취업 준비에 활용할 수 있습니다.',
              gradient: 'from-indigo-400 to-blue-500',
            },
            {
              icon: Target,
              title: '목표 달성',
              description:
                '프로젝트 목표를 설정하고 달성하세요. 데모 데이, 공모전 참가, 창업 준비 등 다양한 목적의 프로젝트를 성공적으로 완수할 수 있습니다.',
              gradient: 'from-purple-400 to-pink-500',
            },
          ].map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full border-2 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                <CardHeader>
                  <div
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container relative z-10 py-20 md:py-28 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              당신의 아이디어로
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                세상을 바꿔보세요
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              지금 가입하고 1,200명 이상의 건국대 학생들과 함께
              <br className="hidden sm:inline" />
              혁신적인 프로젝트를 시작하세요
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                asChild
                className="gradient-primary text-white border-0 text-lg h-14 px-10"
              >
                <Link href="/signup">
                  무료로 시작하기
                  <Rocket className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

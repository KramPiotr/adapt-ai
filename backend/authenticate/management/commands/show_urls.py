from django.core.management.base import BaseCommand
from django.urls import get_resolver
from django.conf import settings

class Command(BaseCommand):
    help = 'Displays all URL patterns of the project'

    def handle(self, *args, **kwargs):
        resolver = get_resolver()
        url_patterns = resolver.url_patterns

        def extract_urls(urlpatterns, prefix=''):
            for entry in urlpatterns:
                if hasattr(entry, 'url_patterns'):
                    yield from extract_urls(entry.url_patterns, prefix + str(entry.pattern))
                else:
                    yield prefix + str(entry.pattern)

        for pattern in extract_urls(url_patterns):
            self.stdout.write(pattern)
